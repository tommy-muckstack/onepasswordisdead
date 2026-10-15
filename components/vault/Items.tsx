"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { allTags, cardBrand, filterItems, formatCard, host, luhn, newItem, subtitle, validExpiry, type Filter, type Item, type ItemType, type VaultData } from "@/lib/vault/model";
import { DEFAULT_GEN, generatePassword, type GenOptions } from "@/lib/vault/generate";
import { validSecret } from "@/lib/vault/totp";
import { CopyButton, Secret, StrengthBar, TotpCode } from "./bits";

const TYPE_LABEL: Record<ItemType, string> = { login: "Login", note: "Secure note", card: "Card" };
const TYPE_ICON: Record<ItemType, string> = { login: "⌘", note: "≡", card: "▭" };
const safeHref = (u?: string) => { if (!u) return null; try { const x = new URL(/^[a-z][a-z0-9+.-]*:/i.test(u) ? u : "https://" + u); return x.protocol === "http:" || x.protocol === "https:" ? x.href : null; } catch { return null; } };
const initial = (i: Item) => (i.title.trim()[0] ?? "?").toUpperCase();

export function Items({ data, filter, setFilter, onSave, onDelete, onFav, flash }: { data: VaultData; filter: Filter; setFilter: (f: Filter) => void; onSave: (i: Item) => void; onDelete: (id: string) => void; onFav: (id: string) => void; flash: (m: string) => void }) {
  const list = useMemo(() => filterItems(data, filter), [data, filter]); const [sel, setSel] = useState<string | null>(null); const [edit, setEdit] = useState<Item | null>(null); const [menu, setMenu] = useState(false); const search = useRef<HTMLInputElement>(null);
  const cur = data.items.find(i => i.id === sel) ?? null;
  useEffect(() => { if (!edit && sel && !cur) setSel(null); if (!edit && !sel && list[0]) setSel(list[0].id); }, [list, sel, cur, edit]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { const t = e.target as HTMLElement; if (t.closest("input,textarea,select")) { if (e.key === "Escape" && t === search.current) { setFilter({ ...filter, q: "" }); search.current?.blur(); } return; }
      if (e.key === "/") { e.preventDefault(); search.current?.focus(); } else if (e.key === "n" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setEdit(newItem("login")); } else if (e.key === "ArrowDown" || e.key === "ArrowUp") { const i = list.findIndex(x => x.id === sel); const n = list[Math.max(0, Math.min(list.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))]; if (n && !edit) { e.preventDefault(); setSel(n.id); } } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [list, sel, edit, filter, setFilter]);
  const title = filter.kind === "all" ? "All items" : filter.kind === "fav" ? "Favorites" : filter.kind === "tag" ? `#${filter.tag}` : TYPE_LABEL[filter.kind] + "s";
  return <div className="op-items">
    <section className="op-list" aria-label="Items">
      <div className="op-list__hd"><h2>{title}<small>{list.length}</small></h2>
        <div className="op-menuwrap"><button className="op-btn op-btn--primary" data-testid="new-item" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(v => !v)}>+ New item</button>
          {menu && <div className="op-menu" role="menu" onMouseLeave={() => setMenu(false)}>{(["login", "card", "note"] as ItemType[]).map(t => <button key={t} role="menuitem" onClick={() => { setEdit(newItem(t)); setMenu(false); }}><span aria-hidden>{TYPE_ICON[t]}</span> {TYPE_LABEL[t]}</button>)}</div>}</div></div>
      <input ref={search} className="op-search" aria-label="Search items" placeholder="Search (press /)" value={filter.q ?? ""} onChange={e => setFilter({ ...filter, q: e.target.value })} />
      <ul role="listbox" aria-label="Item list">{list.map(i => <li key={i.id} role="option" aria-selected={sel === i.id}><button className={"op-row" + (sel === i.id ? " on" : "")} data-testid="item-row" onClick={() => { setSel(i.id); setEdit(null); }}>
        <span className="op-ico" aria-hidden>{initial(i)}</span><span className="op-row__t"><b>{i.title || "Untitled"}</b><small>{subtitle(i)}</small></span>{i.fav && <span className="op-star" aria-label="Favorite">★</span>}</button></li>)}
        {!list.length && <li className="op-empty">{filter.q ? "No items match your search." : data.items.length ? "Nothing here yet." : "Your vault is empty. Add your first item."}</li>}</ul>
    </section>
    <section className="op-detail" aria-label="Item details">
      {edit ? <Editor key={edit.id} item={edit} isNew={!data.items.some(i => i.id === edit.id)} tags={allTags(data)} onCancel={() => setEdit(null)} onSave={i => { onSave(i); setSel(i.id); setEdit(null); flash("Saved"); }} />
        : cur ? <Detail item={cur} onEdit={() => setEdit(cur)} onFav={() => onFav(cur.id)} onDelete={() => { if (confirm(`Delete “${cur.title}”? This can't be undone.`)) { onDelete(cur.id); setSel(null); flash("Deleted"); } }} onTag={t => setFilter({ kind: "tag", tag: t })} />
        : <div className="op-blank"><p>Select an item, or press <kbd>n</kbd> to add one.</p></div>}
    </section>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="op-f"><dt>{label}</dt><dd>{children}</dd></div>; }
function Detail({ item: i, onEdit, onFav, onDelete, onTag }: { item: Item; onEdit: () => void; onFav: () => void; onDelete: () => void; onTag: (t: string) => void }) {
  const href = safeHref(i.url);
  return <article className="op-card" data-testid="detail">
    <header><span className="op-ico op-ico--lg" aria-hidden>{initial(i)}</span><div><h2>{i.title || "Untitled"}</h2><small>{TYPE_LABEL[i.type]}{i.type === "card" && i.number ? ` · ${cardBrand(i.number) || "Card"}` : ""}</small></div>
      <div className="op-actions"><button className="op-btn" aria-pressed={i.fav} onClick={onFav}>{i.fav ? "★ Favorite" : "☆ Favorite"}</button><button className="op-btn" onClick={onEdit}>Edit</button><button className="op-btn op-btn--danger" onClick={onDelete}>Delete</button></div></header>
    <dl>
      {i.type === "login" && <>
        {i.username && <Field label="username"><span>{i.username}</span><CopyButton value={i.username} label="username" /></Field>}
        {i.password && <Field label="password"><Secret value={i.password} label="password" /></Field>}
        {i.totp && <Field label="one-time password"><TotpCode secret={i.totp} /></Field>}
        {i.url && <Field label="website">{href ? <a href={href} target="_blank" rel="noopener noreferrer">{host(i.url)}</a> : <span>{i.url} <small className="op-muted">(not a web link)</small></span>}</Field>}
      </>}
      {i.type === "card" && <>
        {i.holder && <Field label="cardholder"><span>{i.holder}</span></Field>}
        {i.number && <Field label="number"><Secret value={formatCard(i.number)} label="card number" /></Field>}
        {i.expiry && <Field label="expires"><span>{i.expiry}</span>{!validExpiry(i.expiry) && <small className="op-err"> expired or invalid</small>}</Field>}
        {i.cvc && <Field label="security code"><Secret value={i.cvc} label="security code" /></Field>}
      </>}
      {i.notes && <Field label="notes"><span className="op-notes">{i.notes}</span></Field>}
      {i.tags.length > 0 && <Field label="tags"><span className="op-tags">{i.tags.map(t => <button key={t} className="op-tag" onClick={() => onTag(t)}>#{t}</button>)}</span></Field>}
    </dl>
    <footer className="op-muted op-small">Modified {new Date(i.updated).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}{i.type === "login" && i.pwChanged ? ` · password changed ${new Date(i.pwChanged).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : ""}</footer>
  </article>;
}

function Editor({ item, isNew, tags, onSave, onCancel }: { item: Item; isNew: boolean; tags: string[]; onSave: (i: Item) => void; onCancel: () => void }) {
  const [d, setD] = useState<Item>(item); const [tagText, setTagText] = useState(item.tags.join(", ")); const [err, setErr] = useState(""); const [gen, setGen] = useState<GenOptions>(DEFAULT_GEN); const [showGen, setShowGen] = useState(false);
  const set = <K extends keyof Item>(k: K, v: Item[K]) => setD(x => ({ ...x, [k]: v }));
  const save = (e: React.FormEvent) => {
    e.preventDefault(); if (!d.title.trim()) return setErr("Give this item a title.");
    if (d.type === "login" && d.totp && !validSecret(d.totp)) return setErr("That one-time password secret isn't valid base32 (letters A–Z and digits 2–7).");
    onSave({ ...d, title: d.title.trim(), tags: tagText.split(",").map(s => s.trim().replace(/^#/, "")).filter(Boolean), totp: d.totp?.replace(/\s/g, "") || undefined });
  };
  const text = (label: string, k: keyof Item, p: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => <label>{label}<input value={(d[k] as string) ?? ""} onChange={e => set(k, e.target.value as never)} {...p} /></label>;
  return <form className="op-card op-form" onSubmit={save} aria-label={isNew ? "New item" : "Edit item"}>
    <h2>{isNew ? `New ${TYPE_LABEL[d.type].toLowerCase()}` : "Edit item"}</h2>
    {text("Title", "title", { autoFocus: true, placeholder: "e.g. Mailbox" })}
    {d.type === "login" && <>
      {text("Username", "username", { autoComplete: "off" })}
      <label>Password<span className="op-inline"><input aria-label="Password" className="op-mono" type="text" autoComplete="off" spellCheck={false} value={d.password ?? ""} onChange={e => set("password", e.target.value)} /><button type="button" className="op-btn" onClick={() => setShowGen(v => !v)} aria-expanded={showGen}>Generate</button></span></label>
      <StrengthBar pw={d.password ?? ""} />
      {showGen && <div className="op-gen" role="group" aria-label="Password generator"><label>Length {gen.length}<input type="range" min={8} max={64} value={gen.length} onChange={e => setGen({ ...gen, length: +e.target.value })} /></label>
        <span className="op-checks">{(["lower", "upper", "digits", "symbols"] as const).map(k => <label key={k} className="op-check"><input type="checkbox" checked={gen[k]} onChange={e => setGen({ ...gen, [k]: e.target.checked })} />{k}</label>)}</span>
        <button type="button" className="op-btn op-btn--primary" onClick={() => { try { set("password", generatePassword(gen)); } catch { setErr("Pick at least one character type."); } }}>Use a new password</button></div>}
      {text("Website", "url", { placeholder: "https://", inputMode: "url" })}
      {text("One-time password secret (base32)", "totp", { placeholder: "JBSWY3DP…", autoComplete: "off", className: "op-mono" })}
    </>}
    {d.type === "card" && <>
      {text("Cardholder", "holder")}
      <label>Card number<input className="op-mono" inputMode="numeric" autoComplete="off" value={formatCard(d.number ?? "")} onChange={e => set("number", e.target.value.replace(/\D/g, ""))} />{d.number && d.number.length >= 12 && !luhn(d.number) && <small className="op-warnt">This number doesn't pass the card checksum.</small>}</label>
      <div className="op-two">{text("Expiry (MM/YY)", "expiry", { placeholder: "MM/YY", maxLength: 5 })}{text("Security code", "cvc", { inputMode: "numeric", maxLength: 4, autoComplete: "off" })}</div>
    </>}
    <label>Notes<textarea rows={d.type === "note" ? 10 : 4} value={d.notes} onChange={e => set("notes", e.target.value)} /></label>
    <label>Tags (comma separated)<input value={tagText} onChange={e => setTagText(e.target.value)} list="op-tags" placeholder="work, personal" /><datalist id="op-tags">{tags.map(t => <option key={t} value={t} />)}</datalist></label>
    {err && <p className="op-err" role="alert">{err}</p>}
    <div className="op-actions"><button className="op-btn op-btn--primary">Save</button><button type="button" className="op-btn" onClick={onCancel}>Cancel</button></div>
  </form>;
}
