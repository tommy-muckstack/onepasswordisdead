"use client";
import { useEffect, useState } from "react";
import { audit, toCsv, importCsv, type Item, type VaultData } from "@/lib/vault/model";
import { breachCount, DEFAULT_GEN, generatePassphrase, generatePassword, passphraseEntropy, passwordEntropy, strength, type GenOptions } from "@/lib/vault/generate";
import { changePassword, type VaultBlob } from "@/lib/vault/crypto";
import { CopyButton, StrengthBar } from "./bits";
import { track, EVENTS } from "@/lib/analytics";
import { Disclaimer } from "./Gate";

const dl = (name: string, text: string, type = "text/plain") => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };

export function Audit({ data, open }: { data: VaultData; open: (i: Item) => void }) {
  const a = audit(data); const [breach, setBreach] = useState<Record<string, number | null>>({}); const [checking, setChecking] = useState(false);
  const run = async () => { setChecking(true); const r: Record<string, number | null> = {}; for (const i of data.items.filter(x => x.type === "login" && x.password)) r[i.id] = await breachCount(i.password!); setBreach(r); setChecking(false); };
  const pwned = data.items.filter(i => (breach[i.id] ?? 0) > 0);
  const Sec = ({ t, items, hint }: { t: string; items: Item[]; hint: string }) => <section className="op-audit__s" aria-label={t}><h3>{t} <span>{items.length}</span></h3><p className="op-muted op-small">{hint}</p>{items.length > 0 && <ul>{items.map(i => <li key={i.id}><button className="op-link" onClick={() => open(i)}>{i.title}</button></li>)}</ul>}</section>;
  return <div className="op-pane" data-testid="audit"><h2>Security audit</h2>
    <div className="op-score" role="img" aria-label={`Vault health ${a.score} out of 100`}><b>{a.score}</b><span>/ 100 vault health</span></div>
    <Sec t="Weak passwords" items={a.weak} hint="Short, common or predictable. Replace them with generated passwords." />
    <Sec t="Reused passwords" items={a.reused} hint="The same password on more than one login means one breach exposes them all." />
    <Sec t="Old passwords" items={a.old} hint="Not changed in over a year." />
    <Sec t="Without one-time passwords" items={a.noTotp} hint="Add a two-factor secret to logins that support it." />
    <section className="op-audit__s"><h3>Known breaches {Object.keys(breach).length > 0 && <span>{pwned.length}</span>}</h3><p className="op-muted op-small">Optional. Sends only the first 5 characters of each password's SHA-1 hash to the Have I Been Pwned range API (k-anonymity); your passwords never leave this device.</p>
      <button className="op-btn" onClick={run} disabled={checking}>{checking ? "Checking…" : "Check for breached passwords"}</button>
      {Object.keys(breach).length > 0 && (pwned.length ? <ul>{pwned.map(i => <li key={i.id}><button className="op-link" onClick={() => open(i)}>{i.title}</button> <span className="op-muted">seen {breach[i.id]!.toLocaleString()} times</span></li>)}</ul> : <p className="op-ok">None of your passwords were found in known breaches{Object.values(breach).includes(null) ? " (some checks failed, are you offline?)" : ""}.</p>)}</section></div>;
}

export function Generator({ flash }: { flash: (m: string) => void }) {
  const [mode, setMode] = useState<"password" | "passphrase">("password"); const [o, setO] = useState<GenOptions>(DEFAULT_GEN); const [words, setWords] = useState(5); const [out, setOut] = useState("");
  const make = () => { try { setOut(mode === "password" ? generatePassword(o) : generatePassphrase(words, "-", false)); } catch { setOut(""); flash("Pick at least one character type"); } };
  useEffect(make, [mode, o, words]); // eslint-disable-line
  const bits = mode === "password" ? Math.round(passwordEntropy(o)) : Math.round(passphraseEntropy(words));
  return <div className="op-pane" data-testid="generator"><h2>Password generator</h2>
    <div className="op-seg" role="tablist">{(["password", "passphrase"] as const).map(m => <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>{m === "password" ? "Random password" : "Passphrase"}</button>)}</div>
    <div className="op-out"><code className="op-mono" data-testid="generated">{out}</code><span><button className="op-btn" onClick={make}>Regenerate</button><CopyButton value={out} label="generated password" onCopied={() => track(EVENTS.app_password_generated_copied)} /></span></div>
    <StrengthBar pw={out} /><p className="op-muted op-small">{bits} bits of entropy by construction{mode === "passphrase" ? ` (${words} words from a ${Math.round(2 ** (passphraseEntropy(1)))}-word list)` : ""}. Generated with the browser's cryptographic random number generator.</p>
    {mode === "password" ? <div className="op-gen"><label>Length {o.length}<input type="range" min={8} max={64} value={o.length} aria-label="Length" onChange={e => setO({ ...o, length: +e.target.value })} /></label>
      <span className="op-checks">{(["lower", "upper", "digits", "symbols"] as const).map(k => <label key={k} className="op-check"><input type="checkbox" checked={o[k]} onChange={e => setO({ ...o, [k]: e.target.checked })} />{k}</label>)}<label className="op-check"><input type="checkbox" checked={o.avoidAmbiguous} onChange={e => setO({ ...o, avoidAmbiguous: e.target.checked })} />avoid look-alikes (Il1O0)</label></span></div>
      : <div className="op-gen"><label>Words {words}<input type="range" min={3} max={10} value={words} aria-label="Words" onChange={e => setWords(+e.target.value)} /></label></div>}
    <p className="op-muted op-small">Rated: {strength(out).label}</p></div>;
}

type SettingsProps = { blob: VaultBlob; getData: () => VaultData; lockMin: number; setLockMin: (n: number) => void; onErase: () => void; onImport: (items: Item[]) => void; onChanged: (b: VaultBlob, s: import("@/lib/vault/crypto").Session) => void; flash: (m: string) => void };
export function Settings({ blob, getData, lockMin, setLockMin, onErase, onImport, onChanged, flash }: SettingsProps) {
  const [cur, setCur] = useState(""); const [np, setNp] = useState(""); const [np2, setNp2] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const change = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); if (np.length < 10) return setErr("Use at least 10 characters."); if (np !== np2) return setErr("The new passwords don't match."); if (strength(np).score < 2) return setErr("That password is too easy to guess.");
    setBusy(true); try { const r = await changePassword(blob, cur, np); onChanged(r.blob, r.session); setCur(""); setNp(""); setNp2(""); flash("Master password changed"); } catch (x) { setErr((x as Error).message.includes("Wrong") ? "Your current master password is wrong." : (x as Error).message); } finally { setBusy(false); }
  };
  return <div className="op-pane" data-testid="settings"><h2>Settings</h2><Disclaimer />
    <section className="op-set"><h3>Auto-lock</h3><label>Lock the vault after inactivity<select aria-label="Auto-lock" value={lockMin} onChange={e => setLockMin(+e.target.value)}>{[1, 5, 15, 30, 60].map(m => <option key={m} value={m}>{m} {m === 1 ? "minute" : "minutes"}</option>)}</select></label></section>
    <section className="op-set"><h3>Change master password</h3><form onSubmit={change} className="op-form2" aria-label="Change master password">
      <label>Current master password<input type="password" autoComplete="current-password" value={cur} onChange={e => setCur(e.target.value)} /></label>
      <label>New master password<input type="password" autoComplete="new-password" value={np} onChange={e => setNp(e.target.value)} /></label><StrengthBar pw={np} />
      <label>Confirm new password<input type="password" autoComplete="new-password" value={np2} onChange={e => setNp2(e.target.value)} /></label>
      {err && <p className="op-err" role="alert">{err}</p>}<button className="op-btn" disabled={busy || !cur || !np}>{busy ? "Re-encrypting…" : "Change password"}</button></form></section>
    <section className="op-set"><h3>Backup &amp; import</h3>
      <p className="op-muted op-small">The encrypted backup is the same ciphertext stored in this browser. It is useless without your master password. Keep a copy somewhere safe.</p>
      <div className="op-actions"><button className="op-btn" onClick={() => { dl("onepasswordisdead-backup.json", JSON.stringify(blob), "application/json"); track(EVENTS.app_backup_downloaded); }}>Download encrypted backup</button>
        <button className="op-btn" onClick={() => { if (confirm("This file contains all your passwords in plain text. Delete it as soon as you're done. Continue?")) dl("onepasswordisdead-export.csv", toCsv(getData()), "text/csv"); }}>Export as CSV (not encrypted)</button>
        <label className="op-btn op-filebtn">Import CSV<input type="file" accept=".csv,text/csv" hidden data-testid="import-csv" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; const items = importCsv(await f.text()); if (!items.length) flash("No logins with a password column found"); else { onImport(items); flash(`Imported ${items.length} ${items.length === 1 ? "login" : "logins"}`); } e.target.value = ""; }} /></label></div></section>
    <section className="op-set"><h3>How it's protected</h3><p className="op-muted op-small">Master password → PBKDF2-HMAC-SHA256 ({blob.iter.toLocaleString()} iterations, random 16-byte salt) → AES-256-GCM key that the browser won't let scripts export. A fresh random IV is used for every save and the header is authenticated. Nothing unencrypted is written to disk or sent to a server. What this does not protect against: malware or a malicious browser extension on your device, a compromised page script on this site's origin, shoulder surfing, and a weak master password.</p></section>
    <section className="op-set"><h3>Danger zone</h3><button className="op-btn op-btn--danger" onClick={() => { if (confirm("Erase this vault from this browser? Without a backup it cannot be recovered.")) onErase(); }}>Erase vault</button></section></div>;
}
