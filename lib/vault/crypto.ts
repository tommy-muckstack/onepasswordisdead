/**
 * Client-side vault encryption with the WebCrypto API. EXPERIMENTAL and UNAUDITED: read SECURITY.md before storing anything you can't lose.
 *
 * Scheme: key = PBKDF2-HMAC-SHA256(master password, random 16-byte salt, N iterations) -> AES-256-GCM (non-extractable key).
 * Each save encrypts the whole vault JSON with a fresh random 96-bit IV. The header (version, KDF, salt) is bound in as GCM additional data.
 * The master password and derived key never leave memory; only the ciphertext blob is stored.
 */
export const VERSION = 1;
export const DEFAULT_ITERATIONS = 600_000;
export type VaultBlob = { v: number; kdf: "PBKDF2-SHA256"; iter: number; salt: string; iv: string; ct: string };
export type Session = { key: CryptoKey; salt: Uint8Array; iter: number };

const enc = new TextEncoder(), dec = new TextDecoder();
export const b64 = (u: Uint8Array) => { let s = ""; for (const b of u) s += String.fromCharCode(b); return btoa(s); };
export const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
export const randomBytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));
const aad = (v: number, iter: number, salt: string) => enc.encode(`onepasswordisdead|v${v}|PBKDF2-SHA256|${iter}|${salt}`);

async function derive(password: string, salt: Uint8Array, iter: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", enc.encode(password.normalize("NFKC")), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: iter }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
export async function seal<T>(s: Session, data: T): Promise<VaultBlob> {
  const iv = randomBytes(12), salt = b64(s.salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource, additionalData: aad(VERSION, s.iter, salt) as BufferSource }, s.key, enc.encode(JSON.stringify(data))));
  return { v: VERSION, kdf: "PBKDF2-SHA256", iter: s.iter, salt, iv: b64(iv), ct: b64(ct) };
}
export class WrongPasswordError extends Error { constructor() { super("Wrong master password, or the vault data is damaged."); this.name = "WrongPasswordError"; } }
export async function create<T>(password: string, data: T, iter = DEFAULT_ITERATIONS): Promise<{ blob: VaultBlob; session: Session }> {
  if (!password) throw new Error("A master password is required.");
  const salt = randomBytes(16); const session: Session = { key: await derive(password, salt, iter), salt, iter };
  return { blob: await seal(session, data), session };
}
export async function unlock<T>(password: string, blob: VaultBlob): Promise<{ data: T; session: Session }> {
  if (!blob || blob.v !== VERSION || blob.kdf !== "PBKDF2-SHA256") throw new Error("Unsupported vault format.");
  if (!(blob.iter >= 1 && blob.iter <= 10_000_000)) throw new Error("Invalid vault parameters.");
  const salt = unb64(blob.salt); const key = await derive(password, salt, blob.iter);
  try {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(blob.iv) as BufferSource, additionalData: aad(blob.v, blob.iter, blob.salt) as BufferSource }, key, unb64(blob.ct) as BufferSource);
    return { data: JSON.parse(dec.decode(pt)) as T, session: { key, salt, iter: blob.iter } };
  } catch { throw new WrongPasswordError(); }
}
/** Re-encrypts under a new password and a fresh salt. Requires the current password. */
export async function changePassword<T>(blob: VaultBlob, oldPassword: string, newPassword: string, iter?: number): Promise<{ blob: VaultBlob; session: Session; data: T }> {
  const { data } = await unlock<T>(oldPassword, blob); const r = await create(newPassword, data, iter ?? blob.iter); return { ...r, data };
}
export const isBlob = (x: unknown): x is VaultBlob => !!x && typeof x === "object" && (x as VaultBlob).v === VERSION && typeof (x as VaultBlob).ct === "string" && typeof (x as VaultBlob).salt === "string" && typeof (x as VaultBlob).iv === "string" && typeof (x as VaultBlob).iter === "number";
