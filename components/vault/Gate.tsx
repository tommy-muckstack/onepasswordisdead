"use client";
import { useRef, useState } from "react";
import { create, isBlob, unlock, WrongPasswordError, type VaultBlob } from "@/lib/vault/crypto";
import { emptyVault, sampleItems, type VaultData } from "@/lib/vault/model";
import { StrengthBar } from "./bits";

export const DEMO_PASSWORD = "demo-master-password-2026";
export const Disclaimer = () => <div className="op-warn" role="note"><b>Experimental software, not security-audited.</b> Your vault is encrypted in this browser and stored only here. There is no account recovery and no sync: if you forget the master password or clear this site's data, the vault is gone. Keep a backup, and don't make this the only copy of anything you can't lose.</div>;

export function Setup({ demo, onCreated, onRestoreBlob }: { demo: boolean; onCreated: (p: { blob: VaultBlob; session: import("@/lib/vault/crypto").Session; data: VaultData }) => void; onRestoreBlob: (b: VaultBlob) => void }) {
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [ack, setAck] = useState(false); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const file = useRef<HTMLInputElement>(null);
  const go = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); if (pw.length < 10) return setErr("Use at least 10 characters. A few random words work well."); if (pw !== pw2) return setErr("The two passwords don't match."); if (!ack) return setErr("Please confirm you understand there is no recovery.");
    setBusy(true); try { const data = demo ? { items: sampleItems() } : emptyVault(); const r = await create(pw, data); onCreated({ ...r, data }); } catch (x) { setErr(String((x as Error).message)); } finally { setBusy(false); }
  };
  const restore = async (f?: File) => { if (!f) return; try { const j = JSON.parse(await f.text()); if (!isBlob(j)) throw new Error(); onRestoreBlob(j); } catch { setErr("That doesn't look like a vault backup file."); } };
  return <form className="op-gate" onSubmit={go} aria-label="Create your vault">
    <h1>Create your vault</h1><p className="op-muted">Choose a master password. It encrypts everything, and it never leaves this device.</p><Disclaimer />
    {demo && <p className="op-note">Demo account: your vault starts with sample items. <button type="button" className="op-link" onClick={() => { setPw(DEMO_PASSWORD); setPw2(DEMO_PASSWORD); setAck(true); }}>Fill in a demo master password</button></p>}
    <label>Master password<input type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} aria-describedby="pwm" /></label><div id="pwm"><StrengthBar pw={pw} /></div>
    <label>Confirm master password<input type="password" autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} /></label>
    <label className="op-check"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} /> I understand that if I forget this password my data cannot be recovered.</label>
    {err && <p className="op-err" role="alert">{err}</p>}
    <button className="op-btn op-btn--primary" disabled={busy}>{busy ? "Creating…" : "Create vault"}</button>
    <p className="op-muted op-small">Already have a backup? <button type="button" className="op-link" onClick={() => file.current?.click()}>Restore from a backup file</button><input ref={file} hidden type="file" accept="application/json,.json" data-testid="restore-file" onChange={e => restore(e.target.files?.[0])} /></p>
  </form>;
}

export function Unlock({ blob, demo, onUnlocked, onRestore }: { blob: VaultBlob; demo: boolean; onUnlocked: (r: { session: import("@/lib/vault/crypto").Session; data: VaultData }) => void; onRestore: () => void }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [tries, setTries] = useState(0);
  const go = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return; setBusy(true); setErr("");
    try { const r = await unlock<VaultData>(pw, blob); setPw(""); onUnlocked(r); } catch (x) { setTries(t => t + 1); setErr(x instanceof WrongPasswordError ? "That master password didn't work." : String((x as Error).message)); await new Promise(r => setTimeout(r, Math.min(3000, 400 * (tries + 1)))); } finally { setBusy(false); }
  };
  return <form className="op-gate" onSubmit={go} aria-label="Unlock your vault">
    <h1>Unlock your vault</h1><p className="op-muted">Enter your master password. Decryption happens in this tab.</p>
    <label>Master password<input type="password" autoFocus autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} /></label>
    {demo && <p className="op-note">Demo vault password: <code>{DEMO_PASSWORD}</code></p>}
    {err && <p className="op-err" role="alert">{err}</p>}
    <button className="op-btn op-btn--primary" disabled={busy || !pw}>{busy ? "Unlocking…" : "Unlock"}</button>
    <p className="op-muted op-small">Forgot it? There is no recovery. <button type="button" className="op-link" onClick={onRestore}>Erase this vault</button></p>
  </form>;
}
