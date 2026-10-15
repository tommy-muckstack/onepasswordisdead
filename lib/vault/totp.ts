/** RFC 6238 time-based one-time passwords (HMAC-SHA1, 30s step, 6 digits by default) over WebCrypto. */
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32Decode(s: string): Uint8Array {
  const clean = s.toUpperCase().replace(/[\s=-]/g, ""); let bits = 0, val = 0; const out: number[] = [];
  for (const c of clean) { const i = B32.indexOf(c); if (i < 0) throw new Error("Not a valid base32 secret."); val = (val << 5) | i; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } }
  return Uint8Array.from(out);
}
export const validSecret = (s: string) => { try { return base32Decode(s).length >= 10; } catch { return false; } };
export async function totp(secret: string, atMs = Date.now(), digits = 6, step = 30): Promise<string> {
  const key = await crypto.subtle.importKey("raw", base32Decode(secret) as BufferSource, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const counter = Math.floor(atMs / 1000 / step); const buf = new ArrayBuffer(8); const dv = new DataView(buf); dv.setUint32(0, Math.floor(counter / 2 ** 32)); dv.setUint32(4, counter >>> 0);
  const h = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf)); const o = h[h.length - 1] & 15;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 10 ** digits).padStart(digits, "0");
}
export const secondsLeft = (atMs = Date.now(), step = 30) => step - (Math.floor(atMs / 1000) % step);
