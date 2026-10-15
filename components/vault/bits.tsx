"use client";
import { useEffect, useRef, useState } from "react";
import { secondsLeft, totp } from "@/lib/vault/totp";
import { strength } from "@/lib/vault/generate";

export function copyText(text: string, clearAfterMs = 30_000) {
  navigator.clipboard?.writeText(text).catch(() => {});
  setTimeout(() => navigator.clipboard?.writeText("").catch(() => {}), clearAfterMs); // best effort: clipboards are shared with other apps
}
export function CopyButton({ value, label, onCopied }: { value: string; label: string; onCopied?: () => void }) {
  const [done, setDone] = useState(false);
  return <button type="button" className="op-icon" aria-label={`Copy ${label}`} onClick={() => { copyText(value); onCopied?.(); setDone(true); setTimeout(() => setDone(false), 1400); }}>{done ? "Copied" : "Copy"}</button>;
}
export function StrengthBar({ pw }: { pw: string }) {
  const s = strength(pw); const cls = ["bad", "bad", "mid", "good", "great"][s.score];
  return <div className={`op-meter op-meter--${cls}`} role="img" aria-label={`Password strength: ${s.label}, about ${s.bits} bits`}><span style={{ ["--w" as string]: pw ? `${(s.score + 1) * 20}%` : "0%" }} /><small>{pw ? `${s.label} · ${s.bits} bits` : " "}</small></div>;
}
export function TotpCode({ secret }: { secret: string }) {
  const [code, setCode] = useState("······"); const [left, setLeft] = useState(30);
  useEffect(() => { let dead = false; const run = async () => { try { const c = await totp(secret); if (!dead) setCode(c); } catch { if (!dead) setCode("invalid"); } setLeft(secondsLeft()); }; run(); const t = setInterval(run, 1000); return () => { dead = true; clearInterval(t); }; }, [secret]);
  return <span className="op-totp"><b data-testid="totp" aria-label="One-time code">{code.length === 6 ? code.slice(0, 3) + " " + code.slice(3) : code}</b><i style={{ ["--p" as string]: `${(left / 30) * 100}%` }} aria-label={`${left} seconds left`} />{code.length === 6 && <CopyButton value={code} label="one-time code" />}</span>;
}
export function Secret({ value, label, mono = true }: { value: string; label: string; mono?: boolean }) {
  const [show, setShow] = useState(false); const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (t.current) clearTimeout(t.current); }, []);
  return <span className="op-secret"><span className={mono ? "op-mono" : ""} data-testid={`secret-${label}`}>{show ? value : "•".repeat(Math.min(value.length, 16)) || "—"}</span>
    <button type="button" className="op-icon" aria-pressed={show} aria-label={`${show ? "Hide" : "Reveal"} ${label}`} onClick={() => { setShow(s => !s); if (t.current) clearTimeout(t.current); if (!show) t.current = setTimeout(() => setShow(false), 15_000); }}>{show ? "Hide" : "Reveal"}</button>
    <CopyButton value={value} label={label} /></span>;
}
