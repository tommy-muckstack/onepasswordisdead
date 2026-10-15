/** Password and passphrase generation with crypto.getRandomValues (unbiased via rejection sampling) and honest entropy math. */
export type GenOptions = { length: number; lower: boolean; upper: boolean; digits: boolean; symbols: boolean; avoidAmbiguous: boolean };
export const DEFAULT_GEN: GenOptions = { length: 20, lower: true, upper: true, digits: true, symbols: true, avoidAmbiguous: false };
const SETS = { lower: "abcdefghijklmnopqrstuvwxyz", upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", digits: "0123456789", symbols: "!@#$%^&*()-_=+[]{};:,.?" };
const AMBIG = /[Il1O0o]/g;
export function randInt(max: number, rnd: (a: Uint32Array) => Uint32Array = a => crypto.getRandomValues(a)): number {
  if (max <= 0 || max > 2 ** 32) throw new Error("bad range"); const lim = Math.floor(2 ** 32 / max) * max; const a = new Uint32Array(1);
  for (;;) { rnd(a); if (a[0] < lim) return a[0] % max; }
}
export const pools = (o: GenOptions) => (["lower", "upper", "digits", "symbols"] as const).filter(k => o[k]).map(k => (o.avoidAmbiguous ? SETS[k].replace(AMBIG, "") : SETS[k]));
export function generatePassword(o: GenOptions = DEFAULT_GEN, rnd?: (a: Uint32Array) => Uint32Array): string {
  const ps = pools(o); if (!ps.length) throw new Error("Pick at least one character type."); const len = Math.max(ps.length, Math.min(128, Math.floor(o.length)));
  const all = ps.join(""); const chars: string[] = ps.map(p => p[randInt(p.length, rnd)]); // guarantee one of each enabled type
  while (chars.length < len) chars.push(all[randInt(all.length, rnd)]);
  for (let i = chars.length - 1; i > 0; i--) { const j = randInt(i + 1, rnd); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return chars.join("");
}
export const passwordEntropy = (o: GenOptions) => { const n = pools(o).join("").length; return n ? Math.floor(o.length) * Math.log2(n) : 0; };

export const WORDS = ("able acid aged also area army atom aunt away back bake ball band bank barn base bath bead beam bear beat beef bell belt bend bike bird bite blue boat bold bolt bone book boot bowl brew brim buck bulb bull burn bush busy cabin cafe cage cake calm camp cane cape card care cart case cash cave cell chef chin chip city clam clay clip clock cloud club coal coat code coin cold cone cook cool cord corn cost cove crab crew crop crow cube cult curl dairy dale dark dart dash dawn deal deck deep deer desk dial dice dime dish dive dock dome door dose dove down draw drum duck dune dusk dust each earn east easy echo edge elm emit epic exit face fact fade fair farm fast fawn fern fife file film find fire firm fish five flag flat fled flew flip flow foam fold folk fork form fort four frog fuel gain gale game gate gear gift glad glow goat gold golf gown grab gray grid grin grow gulf gust hail half hall hand harp hawk heap heat helm herb hill hint hold home hood hook hope horn hose hunt hush iced inch iron isle jade jazz jerk jolt jump just keen kelp kept kick kind king kiln kite knee knit lace lake lamb lamp land lane lark lava lawn leaf lean lend lens lily lime line link lion list loft logo loop lump lung lure lynx mail main malt mane maple mask mast maze meal melt mesh mile milk mind mint mist moat moon moss moth much nail name navy neat nest nine node noon nose note oak oat oboe omen once open orbit otter oval oven pace pack page pail palm park path pear peak pine pink pipe plan plum pond pony pool port pour pulp pure quay quilt rail rain ramp rare reed reef rest ribs rice ride ring road robe rock roof root rope rose ruby rush sage sail salt sand seal seed shed ship shoe silk sing skip slab slim snow soap soda soil song soup spin star stem swan swim tail tale tank tape team tent tide tile tint toad tray tree trim tube tuna turf twig vale vase vine vow wade wand warm wave weld west wheat whale wick wind wing wolf wood wool yarn yard yawn year yoga zeal zinc zone").split(" ");
export function generatePassphrase(words = 5, sep = "-", cap = false, rnd?: (a: Uint32Array) => Uint32Array): string {
  const n = Math.max(3, Math.min(12, Math.floor(words))); return Array.from({ length: n }, () => { const w = WORDS[randInt(WORDS.length, rnd)]; return cap ? w[0].toUpperCase() + w.slice(1) : w; }).join(sep);
}
export const passphraseEntropy = (words: number) => Math.floor(words) * Math.log2(WORDS.length);

const COMMON = new Set("password 123456 12345678 123456789 qwerty abc123 111111 letmein iloveyou admin welcome monkey dragon football 1234567 sunshine princess login passw0rd master hello freedom whatever qazwsx trustno1 password1 password123 1q2w3e4r 000000 654321 superman michael shadow baseball".split(" "));
export type Strength = { bits: number; score: 0 | 1 | 2 | 3 | 4; label: "Very weak" | "Weak" | "Fair" | "Strong" | "Excellent" };
/** Rough entropy estimate: pool-size based, minus penalties for repeats, runs and common passwords. A guide, not a guarantee. */
export function strength(pw: string): Strength {
  if (!pw) return { bits: 0, score: 0, label: "Very weak" };
  const lower = pw.toLowerCase(); if (COMMON.has(lower) || COMMON.has(lower.replace(/[0-9]+$/, ""))) return { bits: Math.min(10, pw.length), score: 0, label: "Very weak" };
  let pool = 0; if (/[a-z]/.test(pw)) pool += 26; if (/[A-Z]/.test(pw)) pool += 26; if (/[0-9]/.test(pw)) pool += 10; if (/[^A-Za-z0-9]/.test(pw)) pool += 24;
  const uniq = new Set(pw).size; let eff = Math.min(pw.length, uniq * 2); let runs = 0; for (let i = 2; i < pw.length; i++) { const a = pw.charCodeAt(i - 2), b = pw.charCodeAt(i - 1), c = pw.charCodeAt(i); if (b - a === 1 && c - b === 1 || a === b && b === c) runs++; } eff = Math.max(0, eff - runs);
  const words = /^([a-z]{3,8}[ -._]){3,}[a-z]{3,8}$/i.test(pw); const bits = words ? Math.floor((pw.split(/[ -._]/).length) * Math.log2(WORDS.length)) : Math.round(eff * Math.log2(Math.max(pool, 2)));
  const score = bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4; return { bits, score, label: (["Very weak", "Weak", "Fair", "Strong", "Excellent"] as const)[score] };
}

/** Have I Been Pwned range API (k-anonymity): only the first 5 hex chars of the SHA-1 leave the browser. Returns the count, or null if the check failed. */
export async function breachCount(pw: string, fetcher: typeof fetch = fetch): Promise<number | null> {
  try {
    const h = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-1", new TextEncoder().encode(pw)))).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const r = await fetcher(`https://api.pwnedpasswords.com/range/${h.slice(0, 5)}`, { headers: { "Add-Padding": "true" } }); if (!r.ok) return null;
    for (const line of (await r.text()).split(/\r?\n/)) { const [suf, c] = line.split(":"); if (suf?.trim() === h.slice(5)) return Number(c) || 0; } return 0;
  } catch { return null; }
}
