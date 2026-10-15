/** Vault contents and the pure functions over them (no crypto, no DOM). The whole `VaultData` is what gets encrypted. */
import { strength } from "./generate";
export type ItemType = "login" | "note" | "card";
export type Item = {
  id: string; type: ItemType; title: string; fav: boolean; created: number; updated: number; pwChanged?: number;
  username?: string; password?: string; url?: string; totp?: string; // login
  holder?: string; number?: string; expiry?: string; cvc?: string; // card
  notes: string; tags: string[];
};
export type VaultData = { items: Item[] };
export const emptyVault = (): VaultData => ({ items: [] });
let n = 0; export const uid = () => `i_${Date.now().toString(36)}${(n++).toString(36)}${Math.random().toString(36).slice(2, 7)}`;
export const newItem = (type: ItemType, patch: Partial<Item> = {}, now = Date.now()): Item => ({ id: uid(), type, title: "", fav: false, created: now, updated: now, notes: "", tags: [], ...(type === "login" ? { pwChanged: now } : {}), ...patch });
export const upsert = (v: VaultData, it: Item, now = Date.now()): VaultData => {
  const old = v.items.find(x => x.id === it.id); const next = { ...it, updated: now, pwChanged: it.type === "login" ? (old && old.password === it.password ? old.pwChanged ?? it.pwChanged : now) : undefined };
  return { items: old ? v.items.map(x => (x.id === it.id ? next : x)) : [next, ...v.items] };
};
export const remove = (v: VaultData, id: string): VaultData => ({ items: v.items.filter(x => x.id !== id) });
export const toggleFav = (v: VaultData, id: string): VaultData => ({ items: v.items.map(x => (x.id === id ? { ...x, fav: !x.fav } : x)) });

export type Filter = { kind: "all" | "fav" | ItemType | "tag"; tag?: string; q?: string };
export const host = (u?: string) => { if (!u) return ""; try { return new URL(/^[a-z]+:\/\//i.test(u) ? u : "https://" + u).hostname.replace(/^www\./, ""); } catch { return u; } };
export function filterItems(v: VaultData, f: Filter): Item[] {
  const q = (f.q ?? "").trim().toLowerCase();
  return v.items.filter(i => (f.kind === "all" || (f.kind === "fav" ? i.fav : f.kind === "tag" ? i.tags.includes(f.tag ?? "") : i.type === f.kind)) &&
    (!q || [i.title, i.username, host(i.url), i.notes, i.tags.join(" ")].some(s => (s ?? "").toLowerCase().includes(q)))) // secrets (passwords, card numbers) are never searched
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
}
export const allTags = (v: VaultData) => [...new Set(v.items.flatMap(i => i.tags))].sort();
export const subtitle = (i: Item) => i.type === "login" ? (i.username || host(i.url)) : i.type === "card" ? (i.number ? `•••• ${i.number.replace(/\D/g, "").slice(-4)}` : i.holder ?? "") : (i.notes.split("\n")[0] ?? "").slice(0, 60);

/* ---------- audit ---------- */
export type Audit = { weak: Item[]; reused: Item[]; old: Item[]; noTotp: Item[]; score: number };
export function audit(v: VaultData, now = Date.now(), oldDays = 365): Audit {
  const logins = v.items.filter(i => i.type === "login" && i.password); const count = new Map<string, number>(); for (const i of logins) count.set(i.password!, (count.get(i.password!) ?? 0) + 1);
  const weak = logins.filter(i => strength(i.password!).score <= 1); const reused = logins.filter(i => (count.get(i.password!) ?? 0) > 1);
  const old = logins.filter(i => now - (i.pwChanged ?? i.created) > oldDays * 86_400_000); const noTotp = logins.filter(i => !i.totp);
  const bad = new Set([...weak, ...reused, ...old].map(i => i.id)); const score = logins.length ? Math.round(100 * (1 - bad.size / logins.length)) : 100;
  return { weak, reused, old, noTotp, score };
}

/* ---------- cards ---------- */
export const luhn = (num: string) => { const d = num.replace(/\D/g, ""); if (d.length < 12 || d.length > 19) return false; let s = 0; for (let i = 0; i < d.length; i++) { let x = +d[d.length - 1 - i]; if (i % 2) { x *= 2; if (x > 9) x -= 9; } s += x; } return s % 10 === 0; };
export const cardBrand = (num: string) => { const d = num.replace(/\D/g, ""); return /^4/.test(d) ? "Visa" : /^(5[1-5]|2[2-7])/.test(d) ? "Mastercard" : /^3[47]/.test(d) ? "Amex" : /^6(011|5)/.test(d) ? "Discover" : ""; };
export const formatCard = (num: string) => { const d = num.replace(/\D/g, "").slice(0, 19); return /^3[47]/.test(d) ? d.replace(/^(\d{4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" ")) : d.replace(/(\d{4})(?=\d)/g, "$1 "); };
export const validExpiry = (e: string, now = new Date()) => { const m = e.match(/^(\d{2})\s*\/\s*(\d{2})$/); if (!m) return false; const mo = +m[1], yr = 2000 + +m[2]; return mo >= 1 && mo <= 12 && (yr > now.getFullYear() || (yr === now.getFullYear() && mo >= now.getMonth() + 1)); };

/* ---------- CSV ---------- */
const q = (s: string | undefined) => { s = s ?? ""; return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const toCsv = (v: VaultData) => ["type,title,url,username,password,notes,tags", ...v.items.map(i => [i.type, i.title, i.url, i.username, i.type === "card" ? `${i.number ?? ""}|${i.expiry ?? ""}|${i.cvc ?? ""}` : i.password, i.notes, i.tags.join(";")].map(q).join(","))].join("\n") + "\n";
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cur = "", inq = false; text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (inq) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inq = false; } else cur += c; }
    else if (c === '"') inq = true; else if (c === ",") { row.push(cur); cur = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some(x => x !== "")) rows.push(row); row = []; } else cur += c; }
  row.push(cur); if (row.some(x => x !== "")) rows.push(row); return rows;
}
/** Imports logins from any password-manager CSV with name/title, url, username, password and notes columns (common export shapes). */
export function importCsv(text: string, now = Date.now()): Item[] {
  const rows = parseCsvRows(text); if (rows.length < 2) return []; const head = rows[0].map(h => h.trim().toLowerCase());
  const col = (...names: string[]) => head.findIndex(h => names.includes(h)); const t = col("title", "name", "item"), u = col("url", "login_uri", "website", "web site"), un = col("username", "login_username", "user", "login", "email"), pw = col("password", "login_password"), nt = col("notes", "note", "extra"), tg = col("tags", "folder", "grouping");
  if (pw < 0) return []; const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  return rows.slice(1).map(r => ({ r, password: get(r, pw) })).filter(x => x.password || get(x.r, t)).map(({ r, password }) => newItem("login", { title: get(r, t) || host(get(r, u)) || "Imported login", url: get(r, u), username: get(r, un), password, notes: get(r, nt), tags: get(r, tg).split(/[;,]/).map(s => s.trim()).filter(Boolean) }, now));
}
export const sampleItems = (now = Date.now()): Item[] => [
  newItem("login", { title: "Mailbox", url: "https://mail.example.com", username: "tommy@example.com", password: "r7#Vq2!mLw9$Zc4xPe8T", totp: "JBSWY3DPEHPK3PXP", fav: true, notes: "Primary email. Recovery codes are in the Recovery note.", tags: ["personal"] }, now - 30 * 86_400_000),
  newItem("login", { title: "Team chat", url: "https://chat.example.org", username: "tommy", password: "maple-otter-lantern-drift-cove", totp: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", tags: ["work"] }, now - 90 * 86_400_000),
  newItem("login", { title: "Photo storage", url: "https://photos.example.net", username: "tommy@example.com", password: "summer2020", tags: ["personal"] }, now - 500 * 86_400_000),
  newItem("login", { title: "Pizza club", url: "https://pizza.example.com", username: "tommy", password: "summer2020", tags: ["personal"] }, now - 200 * 86_400_000),
  newItem("login", { title: "Hosting dashboard", url: "https://cloud.example.dev", username: "ops@example.com", password: "Kd8$mP2vXq!7rTn4Wz", tags: ["work"], fav: true }, now - 10 * 86_400_000),
  newItem("login", { title: "Old forum", url: "https://forum.example.org", username: "tommy_k", password: "qwerty123", tags: ["personal"] }, now - 700 * 86_400_000),
  newItem("card", { title: "Travel card", holder: "Tommy Example", number: "4242424242424242", expiry: "12/29", cvc: "123", notes: "Test number, not a real card." }, now - 20 * 86_400_000),
  newItem("note", { title: "Recovery codes", notes: "Mailbox: 4F2K-9XQ1, 7TNB-0LWD, 2MZC-8RVA\nKeep this note private.", tags: ["personal"] }, now - 40 * 86_400_000),
];
