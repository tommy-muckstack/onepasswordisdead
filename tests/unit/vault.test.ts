import { describe, it, expect } from "vitest";
import { changePassword, create, isBlob, seal, unb64, unlock, WrongPasswordError, b64, type VaultBlob } from "@/lib/vault/crypto";
import { base32Decode, secondsLeft, totp, validSecret } from "@/lib/vault/totp";
import { breachCount, DEFAULT_GEN, generatePassphrase, generatePassword, passphraseEntropy, passwordEntropy, randInt, strength, WORDS } from "@/lib/vault/generate";
import { allTags, audit, cardBrand, emptyVault, filterItems, formatCard, host, importCsv, luhn, newItem, parseCsvRows, remove, sampleItems, subtitle, toCsv, toggleFav, upsert, validExpiry } from "@/lib/vault/model";

const ITER = 1000;
describe("vault encryption", () => {
  it("round-trips data and never stores plaintext", async () => {
    const data = { items: [{ title: "Bank", password: "hunter2-very-secret" }] };
    const { blob } = await create("correct horse", data, ITER);
    expect(isBlob(blob)).toBe(true); expect(JSON.stringify(blob)).not.toMatch(/hunter2|Bank/);
    const r = await unlock<typeof data>("correct horse", blob); expect(r.data).toEqual(data);
  });
  it("rejects a wrong password with a typed error", async () => {
    const { blob } = await create("right", { a: 1 }, ITER); await expect(unlock("wrong", blob)).rejects.toBeInstanceOf(WrongPasswordError);
  });
  it("uses a fresh salt and IV every time", async () => {
    const a = await create("pw", { a: 1 }, ITER), b = await create("pw", { a: 1 }, ITER); expect(a.blob.salt).not.toBe(b.blob.salt); expect(a.blob.ct).not.toBe(b.blob.ct);
    const c = await seal(a.session, { a: 1 }), d = await seal(a.session, { a: 1 }); expect(c.iv).not.toBe(d.iv); expect(unb64(c.iv)).toHaveLength(12); expect(unb64(c.salt)).toHaveLength(16);
  });
  it("detects tampering with ciphertext and with the bound header", async () => {
    const { blob } = await create("pw", { a: 1 }, ITER); const ct = unb64(blob.ct); ct[0] ^= 1;
    await expect(unlock("pw", { ...blob, ct: b64(ct) })).rejects.toBeInstanceOf(WrongPasswordError);
    await expect(unlock("pw", { ...blob, iter: blob.iter + 1 })).rejects.toBeInstanceOf(WrongPasswordError);
  });
  it("normalizes unicode passwords (NFKC)", async () => {
    const { blob } = await create("pa\u0301ssword", { ok: true }, ITER); expect((await unlock<{ ok: boolean }>("p\u00e1ssword", blob)).data.ok).toBe(true);
  });
  it("re-seals with the unlocked session and still opens", async () => {
    const { blob, session } = await create("pw", { n: 1 }, ITER); const next = await seal(session, { n: 2 }); expect((await unlock<{ n: number }>("pw", next)).data.n).toBe(2); expect(next.salt).toBe(blob.salt);
  });
  it("changes the master password and invalidates the old one", async () => {
    const { blob } = await create("old", { n: 7 }, ITER); const r = await changePassword<{ n: number }>(blob, "old", "new", ITER);
    expect(r.blob.salt).not.toBe(blob.salt); expect((await unlock<{ n: number }>("new", r.blob)).data.n).toBe(7); await expect(unlock("old", r.blob)).rejects.toBeInstanceOf(WrongPasswordError);
    await expect(changePassword(blob, "bad", "new", ITER)).rejects.toBeInstanceOf(WrongPasswordError);
  });
  it("refuses empty passwords and unsupported or hostile blobs", async () => {
    await expect(create("", {}, ITER)).rejects.toThrow(/required/);
    const { blob } = await create("pw", {}, ITER); await expect(unlock("pw", { ...blob, v: 2 } as unknown as VaultBlob)).rejects.toThrow(/Unsupported/);
    await expect(unlock("pw", { ...blob, iter: 0 })).rejects.toThrow(/Invalid/); expect(isBlob({ v: 1 })).toBe(false); expect(isBlob(null)).toBe(false);
  });
});

describe("totp (RFC 6238 test vectors)", () => {
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"; // ASCII "12345678901234567890"
  it("matches the RFC SHA-1 vectors", async () => {
    expect(await totp(secret, 59_000, 8)).toBe("94287082"); expect(await totp(secret, 1111111109_000, 8)).toBe("07081804"); expect(await totp(secret, 1234567890_000, 8)).toBe("89005924"); expect(await totp(secret, 20000000000_000, 8)).toBe("65353130");
    expect(await totp(secret, 59_000)).toBe("287082");
  });
  it("decodes base32 tolerant of spaces, case and padding", () => { expect(new TextDecoder().decode(base32Decode("gezd gnbv gy3t qojq gezd gnbv gy3t qojq"))).toBe("12345678901234567890"); expect(() => base32Decode("not*valid")).toThrow(); expect(validSecret("JBSWY3DPEHPK3PXP")).toBe(true); expect(validSecret("AB")).toBe(false); });
  it("counts down the 30s window", () => { expect(secondsLeft(0)).toBe(30); expect(secondsLeft(29_000)).toBe(1); expect(secondsLeft(30_000)).toBe(30); });
});

describe("generators", () => {
  it("honors length and character classes", () => {
    for (let i = 0; i < 50; i++) { const p = generatePassword({ ...DEFAULT_GEN, length: 12 }); expect(p).toHaveLength(12); expect(p).toMatch(/[a-z]/); expect(p).toMatch(/[A-Z]/); expect(p).toMatch(/[0-9]/); expect(p).toMatch(/[^A-Za-z0-9]/); }
    expect(generatePassword({ ...DEFAULT_GEN, length: 30, upper: false, symbols: false })).toMatch(/^[a-z0-9]{30}$/);
    expect(generatePassword({ ...DEFAULT_GEN, length: 200 })).toHaveLength(128); expect(generatePassword({ ...DEFAULT_GEN, length: 1 }).length).toBe(4);
  });
  it("can avoid ambiguous characters and requires a class", () => {
    for (let i = 0; i < 30; i++) expect(generatePassword({ ...DEFAULT_GEN, length: 40, avoidAmbiguous: true })).not.toMatch(/[Il1O0o]/);
    expect(() => generatePassword({ ...DEFAULT_GEN, lower: false, upper: false, digits: false, symbols: false })).toThrow();
  });
  it("is unbiased across a small range", () => { const c = [0, 0, 0]; for (let i = 0; i < 6000; i++) c[randInt(3)]++; for (const x of c) expect(Math.abs(x - 2000)).toBeLessThan(250); });
  it("rejection sampling retries values above the limit", () => { let calls = 0; const rnd = (a: Uint32Array) => { a[0] = calls++ === 0 ? 0xffffffff : 7; return a; }; expect(randInt(10, rnd)).toBe(7); expect(calls).toBe(2); });
  it("reports entropy honestly", () => { expect(passwordEntropy({ ...DEFAULT_GEN, length: 10, upper: false, symbols: false, digits: true })).toBeCloseTo(10 * Math.log2(36), 5); expect(passphraseEntropy(5)).toBeCloseTo(5 * Math.log2(WORDS.length), 5); });
  it("wordlist has no duplicates and passphrases have the right shape", () => { expect(new Set(WORDS).size).toBe(WORDS.length); expect(WORDS.length).toBeGreaterThan(256); const p = generatePassphrase(5, "-", true); expect(p.split("-")).toHaveLength(5); expect(p).toMatch(/^([A-Z][a-z]+-){4}[A-Z][a-z]+$/); expect(generatePassphrase(1).split("-")).toHaveLength(3); });
  it("rates strength sensibly", () => {
    expect(strength("").label).toBe("Very weak"); expect(strength("password1").score).toBe(0); expect(strength("aaaaaaaaaaaa").score).toBeLessThanOrEqual(1); expect(strength("abc123").score).toBeLessThanOrEqual(1);
    expect(strength("maple-otter-lantern-drift-cove").score).toBe(2); expect(strength("maple-otter-lantern-drift-cove-brisk-quiet").score).toBeGreaterThanOrEqual(3); expect(strength("Kd8$mP2vXq!7rTn4Wz").score).toBe(4); expect(strength("Tr0ub4dor&3").score).toBeLessThanOrEqual(3);
  });
  it("checks breaches with k-anonymity and never sends the full hash", async () => {
    let url = ""; const sha1 = "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8"; // sha1("password")
    const fake = (async (u: string) => { url = u; return new Response(`0000000000000000000000000000000000A:1\n${sha1.slice(5)}:9545824\nFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF:2`); }) as unknown as typeof fetch;
    expect(await breachCount("password", fake)).toBe(9545824); expect(url).toBe("https://api.pwnedpasswords.com/range/5BAA6"); expect(url).not.toContain(sha1.slice(5));
    expect(await breachCount("zq9!no-such-pw", fake)).toBe(0); expect(await breachCount("x", (async () => { throw new Error("offline"); }) as unknown as typeof fetch)).toBeNull();
    expect(await breachCount("x", (async () => new Response("", { status: 500 })) as unknown as typeof fetch)).toBeNull();
  });
});

describe("vault model", () => {
  const NOW = Date.UTC(2026, 9, 14);
  it("adds, updates and removes items; tracks password changes", () => {
    let v = emptyVault(); const it = newItem("login", { title: "A", username: "u", password: "p1" }, NOW); v = upsert(v, it, NOW); expect(v.items).toHaveLength(1);
    v = upsert(v, { ...v.items[0], title: "A2" }, NOW + 1000); expect(v.items[0].title).toBe("A2"); expect(v.items[0].pwChanged).toBe(NOW);
    v = upsert(v, { ...v.items[0], password: "p2" }, NOW + 2000); expect(v.items[0].pwChanged).toBe(NOW + 2000);
    v = toggleFav(v, it.id); expect(v.items[0].fav).toBe(true); v = remove(v, it.id); expect(v.items).toEqual([]);
  });
  it("filters by kind, tag and text, and never searches secrets", () => {
    const v = { items: sampleItems(NOW) }; expect(filterItems(v, { kind: "card" })).toHaveLength(1); expect(filterItems(v, { kind: "fav" }).map(i => i.title)).toEqual(["Hosting dashboard", "Mailbox"]);
    expect(filterItems(v, { kind: "tag", tag: "work" })).toHaveLength(2); expect(filterItems(v, { kind: "all", q: "chat.example" }).map(i => i.title)).toEqual(["Team chat"]);
    expect(filterItems(v, { kind: "all", q: "hunter" })).toEqual([]); expect(filterItems(v, { kind: "all", q: "4242" })).toEqual([]); expect(filterItems(v, { kind: "all", q: "qwerty123" })).toEqual([]);
    expect(allTags(v)).toEqual(["personal", "work"]); expect(filterItems(v, { kind: "all" })[0].title).toBe("Hosting dashboard");
  });
  it("derives hostnames and subtitles", () => { expect(host("https://www.example.com/path")).toBe("example.com"); expect(host("example.org")).toBe("example.org"); expect(host("")).toBe(""); expect(subtitle(sampleItems(NOW).find(i => i.type === "card")!)).toBe("•••• 4242"); });
  it("audits weak, reused and old passwords", () => {
    const a = audit({ items: sampleItems(NOW) }, NOW); expect(a.weak.map(i => i.title)).toContain("Old forum"); expect(a.reused.map(i => i.title).sort()).toEqual(["Photo storage", "Pizza club"]);
    expect(a.old.map(i => i.title).sort()).toEqual(["Old forum", "Photo storage"]); expect(a.noTotp.length).toBeGreaterThan(1); expect(a.score).toBeLessThan(100); expect(audit(emptyVault(), NOW).score).toBe(100);
  });
  it("validates cards", () => {
    expect(luhn("4242 4242 4242 4242")).toBe(true); expect(luhn("4242 4242 4242 4241")).toBe(false); expect(luhn("123")).toBe(false); expect(cardBrand("4242")).toBe("Visa"); expect(cardBrand("5555")).toBe("Mastercard"); expect(cardBrand("371449635398431")).toBe("Amex");
    expect(formatCard("4242424242424242")).toBe("4242 4242 4242 4242"); expect(formatCard("371449635398431")).toBe("3714 496353 98431");
    expect(validExpiry("12/29", new Date(2026, 9, 1))).toBe(true); expect(validExpiry("09/26", new Date(2026, 9, 1))).toBe(false); expect(validExpiry("13/30")).toBe(false); expect(validExpiry("1229")).toBe(false);
  });
  it("round-trips CSV including quotes, commas and newlines", () => {
    const v = { items: [newItem("login", { title: 'He said "hi", ok', url: "https://a.com", username: "u", password: "p,w\nx", notes: "line1\nline2", tags: ["a", "b"] }, NOW)] };
    const rows = parseCsvRows(toCsv(v)); expect(rows[1][1]).toBe('He said "hi", ok'); expect(rows[1][4]).toBe("p,w\nx");
    const back = importCsv(toCsv(v), NOW); expect(back[0]).toMatchObject({ title: 'He said "hi", ok', password: "p,w\nx", notes: "line1\nline2", tags: ["a", "b"], username: "u" });
  });
  it("imports other managers' CSV shapes and ignores junk", () => {
    const chrome = "name,url,username,password,note\nGitHub,https://github.com,me,pw1,\nNo password,https://x.com,me,,\n"; const r = importCsv(chrome, NOW); expect(r.map(i => i.title)).toEqual(["GitHub", "No password"]); expect(r[0].password).toBe("pw1");
    expect(importCsv("a,b\n1,2")).toEqual([]); expect(importCsv("")).toEqual([]); expect(importCsv("title,url\nx,y")).toEqual([]);
    expect(importCsv("login_uri,login_username,login_password,folder\nhttps://z.com,zed,secret,Work;Home")[0]).toMatchObject({ title: "z.com", tags: ["Work", "Home"] });
  });
});
