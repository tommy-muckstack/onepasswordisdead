"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { seal, type Session, type VaultBlob } from "@/lib/vault/crypto";
import { audit, emptyVault, remove, toggleFav, upsert, type Filter, type Item, type VaultData } from "@/lib/vault/model";
import { eraseBlob, loadBlob, loadPrefs, saveBlob, savePrefs } from "@/lib/vault/store";
import { Setup, Unlock } from "./Gate";
import { Items } from "./Items";
import { Audit, Generator, Settings } from "./Tools";
import { allTags } from "@/lib/vault/model";
import { track, identify, EVENTS } from "@/lib/analytics";

type Phase = "loading" | "setup" | "locked" | "open";
type Pane = "items" | "audit" | "generator" | "settings";

export function Workspace({ uid, demo, guest }: { uid: string; name: string; email: string; demo: boolean; guest?: boolean }) {
  const [phase, setPhase] = useState<Phase>("loading"); const [blob, setBlob] = useState<VaultBlob | null>(null); const [data, setData] = useState<VaultData>(emptyVault());
  const [pane, setPane] = useState<Pane>("items"); const [filter, setFilter] = useState<Filter>({ kind: "all" }); const [toast, setToast] = useState(""); const [lockMin, setLockMinState] = useState(5); const [nav, setNav] = useState(false);
  const dataRef = useRef<VaultData>(emptyVault()); const session = useRef<Session | null>(null); const chain = useRef<Promise<void>>(Promise.resolve()); const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Identify signed-in accounts by Firebase uid; guests and the demo account are never identified.
  useEffect(() => { identify(uid, demo ? "demo" : guest ? "guest" : "firebase"); }, [uid, demo, guest]);
  useEffect(() => { const b = loadBlob(uid); setBlob(b); setLockMinState(loadPrefs(uid).lockMin); setPhase(b ? "locked" : "setup"); }, [uid]);
  const flash = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(t => (t === m ? "" : t)), 2400); }, []);
  const lock = useCallback((auto = false) => { if (session.current) track(EVENTS.app_vault_locked, { auto }); session.current = null; dataRef.current = emptyVault(); setData(emptyVault()); setPane("items"); setFilter({ kind: "all" }); setPhase(loadBlob(uid) ? "locked" : "setup"); }, [uid]);
  // auto-lock on inactivity
  useEffect(() => {
    if (phase !== "open") return; const reset = () => { if (idle.current) clearTimeout(idle.current); idle.current = setTimeout(() => lock(true), lockMin * 60_000); };
    reset(); const ev = ["pointerdown", "keydown", "wheel", "touchstart"] as const; ev.forEach(e => window.addEventListener(e, reset, { passive: true })); return () => { ev.forEach(e => window.removeEventListener(e, reset)); if (idle.current) clearTimeout(idle.current); };
  }, [phase, lockMin, lock]);
  const persist = useCallback((next: VaultData) => { const s = session.current; if (!s) return; chain.current = chain.current.then(async () => { const b = await seal(s, next); saveBlob(uid, b); setBlob(b); }); }, [uid]);
  const commit = useCallback((f: (v: VaultData) => VaultData) => { const next = f(dataRef.current); dataRef.current = next; setData(next); persist(next); }, [persist]);
  const opened = (r: { session: Session; data: VaultData; blob?: VaultBlob }) => { session.current = r.session; dataRef.current = r.data; setData(r.data); if (r.blob) { saveBlob(uid, r.blob); setBlob(r.blob); } setPhase("open"); };
  const setLockMin = (n: number) => { setLockMinState(n); savePrefs(uid, { lockMin: n }); };
  if (phase === "loading") return <div className="op-loading" role="status">Loading…</div>;
  if (phase === "setup") return <div className="op-gatewrap"><Setup demo={demo} onCreated={r => { track(EVENTS.app_vault_created); opened(r); }} onRestoreBlob={b => { saveBlob(uid, b); setBlob(b); setPhase("locked"); }} /></div>;
  if (phase === "locked" && blob) return <div className="op-gatewrap"><Unlock blob={blob} demo={demo} onUnlocked={r => { track(EVENTS.app_vault_unlocked); opened(r); }} onRestore={() => { if (confirm("Erase this vault from this browser so you can start over or restore a backup? It cannot be recovered without a backup.")) { eraseBlob(uid); setBlob(null); setPhase("setup"); } }} /></div>;
  const a = audit(data); const issues = new Set([...a.weak, ...a.reused, ...a.old].map(i => i.id)).size;
  const go = (p: Pane, f?: Filter) => { setPane(p); if (f) setFilter({ ...f, q: "" }); setNav(false); };
  const isF = (k: Filter["kind"], tag?: string) => pane === "items" && filter.kind === k && filter.tag === tag;
  const count = (k: Filter["kind"]) => (k === "all" ? data.items.length : k === "fav" ? data.items.filter(i => i.fav).length : data.items.filter(i => i.type === k).length);
  const NavBtn = ({ on, onClick, label, n, id }: { on: boolean; onClick: () => void; label: string; n?: number; id?: string }) => <button className={"op-nav__i" + (on ? " on" : "")} onClick={onClick} data-testid={id}>{label}{n !== undefined && <span>{n}</span>}</button>;
  return <div className="op">
    <button className="op-burger" aria-label="Menu" aria-expanded={nav} onClick={() => setNav(v => !v)}>☰ Menu</button>
    <nav className={"op-nav" + (nav ? " open" : "")} aria-label="Vault">
      <NavBtn on={isF("all")} onClick={() => go("items", { kind: "all" })} label="All items" n={count("all")} />
      <NavBtn on={isF("fav")} onClick={() => go("items", { kind: "fav" })} label="★ Favorites" n={count("fav")} />
      <div className="op-nav__h">Categories</div>
      <NavBtn on={isF("login")} onClick={() => go("items", { kind: "login" })} label="Logins" n={count("login")} />
      <NavBtn on={isF("card")} onClick={() => go("items", { kind: "card" })} label="Cards" n={count("card")} />
      <NavBtn on={isF("note")} onClick={() => go("items", { kind: "note" })} label="Secure notes" n={count("note")} />
      {allTags(data).length > 0 && <div className="op-nav__h">Tags</div>}
      {allTags(data).map(t => <NavBtn key={t} on={isF("tag", t)} onClick={() => go("items", { kind: "tag", tag: t })} label={`#${t}`} />)}
      <div className="op-nav__h">Tools</div>
      <NavBtn on={pane === "audit"} onClick={() => go("audit")} label="Security audit" n={issues || undefined} id="nav-audit" />
      <NavBtn on={pane === "generator"} onClick={() => go("generator")} label="Generator" id="nav-generator" />
      <NavBtn on={pane === "settings"} onClick={() => go("settings")} label="Settings" id="nav-settings" />
      <button className="op-btn op-lock" onClick={() => lock()} data-testid="lock">🔒 Lock now</button>
      <p className="op-nav__foot">Auto-locks after {lockMin} min idle. Encrypted in this browser only.</p>
    </nav>
    <main className="op-main">
      {pane === "items" && <Items data={data} filter={filter} setFilter={setFilter} onSave={i => { track(EVENTS.app_item_saved); commit(v => upsert(v, i)); }} onDelete={id => commit(v => remove(v, id))} onFav={id => commit(v => toggleFav(v, id))} flash={flash} />}
      {pane === "audit" && <Audit data={data} open={(i: Item) => { setPane("items"); setFilter({ kind: "all", q: i.title }); }} />}
      {pane === "generator" && <Generator flash={flash} />}
      {pane === "settings" && blob && <Settings blob={blob} getData={() => data} lockMin={lockMin} setLockMin={setLockMin} onErase={() => { eraseBlob(uid); session.current = null; dataRef.current = emptyVault(); setBlob(null); setData(emptyVault()); setPhase("setup"); }} onImport={items => { track(EVENTS.app_logins_imported); commit(v => items.reduce((acc, it) => upsert(acc, it), v)); }} onChanged={(b, s) => { track(EVENTS.app_master_password_changed); session.current = s; saveBlob(uid, b); setBlob(b); }} flash={flash} />}
    </main>
    {toast && <div className="op-toast" role="status" data-testid="toast">{toast}</div>}
  </div>;
}
