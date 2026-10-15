"use client";
// 1Password-style sign in: rail + logo, QR box, email step, guide panel.
import { useState } from "react";
import Link from "next/link";
import type { FirebaseClientConfig } from "@/lib/isdead-auth/config";
import { useAuth } from "@/components/useAuth";

function RailLogo() {
  return <svg className="opa-logo" viewBox="0 0 120 120" aria-hidden><circle cx="60" cy="60" r="58" fill="#8f9195" /><circle cx="60" cy="60" r="53" fill="#fff" /><circle cx="60" cy="60" r="48" fill="#0572ec" /><circle cx="60" cy="60" r="36" fill="#e9f2ff" /><circle cx="60" cy="60" r="30" fill="#0572ec" /><circle cx="60" cy="60" r="24" fill="#fff" /><path d="M54 40 h12 a3 3 0 0 1 3 3 v6 a8 8 0 0 1 -3 6 v26 a3 3 0 0 1 -3 3 h-6 a3 3 0 0 1 -3 -3 V55 a8 8 0 0 1 -3 -6 v-6 a3 3 0 0 1 3 -3z" fill="#1d2a3a" /><circle cx="60" cy="47" r="4.500" fill="#fff" /></svg>;
}
function Qr() {
  const n = 25, cells: React.ReactNode[] = [];
  const fin = (x: number, y: number) => (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (fin(x, y)) continue;
    const cx = x - 12, cy = y - 12; if (cx * cx + cy * cy < 28) continue;
    if (((x * 7 + y * 13 + x * y * 3) % 5) < 2) cells.push(<rect key={`${x}-${y}`} x={x * 6} y={y * 6} width="5.200" height="5.200" fill="#1f2a5a" />);
  }
  const f = (x: number, y: number) => <g key={`f${x}${y}`}><rect x={x * 6} y={y * 6} width="42" height="42" rx="6" fill="#1f2a5a" /><rect x={x * 6 + 6} y={y * 6 + 6} width="30" height="30" rx="3" fill="#fff" /><rect x={x * 6 + 12} y={y * 6 + 12} width="18" height="18" rx="2" fill="#1f2a5a" /></g>;
  return <svg viewBox="0 0 150 150" width="100%" height="100%" aria-hidden>{cells}{f(0, 0)}{f(n - 7, 0)}{f(0, n - 7)}<circle cx="75" cy="75" r="19" fill="#1f2a5a" /><path d="M71 64 h8 v18 h-8z" fill="#fff" /><circle cx="75" cy="66" r="3" fill="#fff" /></svg>;
}
function Lock() {
  return <svg viewBox="0 0 360 168" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden><defs><linearGradient id="opg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f6b6d3" /><stop offset=".5" stopColor="#f3c6dd" /><stop offset="1" stopColor="#f6cbb1" /></linearGradient></defs><rect width="360" height="168" fill="url(#opg)" /><rect x="40" y="110" width="60" height="22" rx="3" fill="#f1d7e6" opacity=".9" /><rect x="110" y="120" width="70" height="20" rx="3" fill="#f6e2ea" opacity=".9" /><rect x="20" y="140" width="80" height="20" rx="3" fill="#e9c0d8" /><rect x="205" y="102" width="110" height="52" rx="8" fill="#c9cfe0" /><rect x="228" y="88" width="64" height="30" rx="6" fill="#e5e8f2" /><path d="M236 86 v-32 a28 28 0 0 1 56 0 v32" fill="none" stroke="#9aa3b8" strokeWidth="12" /><rect x="222" y="72" width="76" height="50" rx="8" fill="#6d7592" /><circle cx="260" cy="94" r="6" fill="#d3d8e6" /><rect x="257" y="95" width="6" height="16" rx="2" fill="#d3d8e6" /></svg>;
}
export function AuthScreen({ config, demo, to, signup = false }: { config: FirebaseClientConfig | null; demo: boolean; to: string; signup?: boolean }) {
  const a = useAuth({ config, demo, to, signup });
  const [pub, setPub] = useState(false);
  const su = a.mode === "signup", reset = a.mode === "reset";
  return <main className="opa">
    <div className="opa-rail"><i /><i /><RailLogo /></div>
    <section className="opa-col">
      <h1>{reset ? "Reset your password" : su ? "Create a new account" : "Sign in to 1Password"}</h1>
      {!su && !reset && <div className="opa-qr">
        <div className="opa-qr__top"><b>Use QR Code</b>
          <ol><li><span>1</span>Open 1Password on a mobile device where you’re signed in.</li><li><span>2</span>Select the account icon or 1Password logo in the top corner.</li><li><span>3</span>Choose “Scan QR Code.”</li></ol>
          <div className="opa-qr__img"><Qr /></div></div>
        <label className="opa-qr__chk"><input type="checkbox" checked={pub} onChange={e => setPub(e.target.checked)} /> This is a public or shared computer</label>
      </div>}
      {!su && !reset && <div className="opa-or"><i /><span>OR</span><i /></div>}
      <form onSubmit={a.submit(true)}>
        <label htmlFor="opa-e">Email</label>
        <input id="opa-e" type="email" required autoComplete="email" value={a.email} onChange={e => a.setEmail(e.target.value)} readOnly={a.step === 2} />
        {a.step === 2 && !reset && <><label htmlFor="opa-p">Password</label><input id="opa-p" type="password" required minLength={6} autoFocus value={a.password} onChange={e => a.setPassword(e.target.value)} autoComplete={su ? "new-password" : "current-password"} /></>}
        <button className="opa-cta" disabled={a.busy}>{reset ? "Send reset link" : a.step === 2 && su ? "Create account" : "Continue"}</button>
        {a.err && <p role="alert" className="opa-err">{a.err}</p>}{a.note && <p role="status" className="opa-ok">{a.note}</p>}
      </form>
      {!reset && <button type="button" className="opa-g" onClick={a.google} disabled={a.busy}>Continue with Google</button>}
      <div className="opa-btm"><div className="opa-sel">1Password.com <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden><path d="M1 1l4 4 4-4" stroke="#333" strokeWidth="1.600" fill="none" /></svg></div>
      <p className="opa-links"><a href="#" onClick={a.go("reset")}>Find my account</a> • <a href="#" onClick={a.off}>Have a team account?</a> •<br />{su ? <a href="#" onClick={a.go("signin")}>Sign in to an existing account</a> : <a href="#" onClick={a.go("signup")}>Create a new account</a>}</p>
      <p className="opa-foot"><a href="#" onClick={a.off}>Version 2363</a> — © 2026 <a href="#" onClick={a.off}>1Password</a>. All rights reserved.<br />4711 Yonge St, 10th Floor, Toronto, Ontario, M2N 6K8, Canada.</p>
      {a.demo && <button type="button" className="opa-demo" onClick={a.useDemo}>Use the demo account</button>}</div>
    </section>
    <aside className="opa-guide">
      <small>GUIDE</small><h2>How secure is my password?</h2>
      <div className="opa-guide__img"><Lock /></div>
      <p>As an average internet user, you probably have over 100 passwords for various online accounts. All of these login credentials should be strong and unique but the reality is that people often choose passwords that could take an hour or two for a hacker to crack. Read our guide to learn how to stay safe online.</p>
      <Link href="/pricing" className="opa-guide__a">Read the guide</Link>
    </aside>
    {!a.configured && <p className="opa-cfg" role="status">Sign-in isn’t configured on this deployment yet.</p>}
  </main>;
}
