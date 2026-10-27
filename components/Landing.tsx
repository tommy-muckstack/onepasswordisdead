import Link from "next/link";
import { OpPricing } from "@/components/OpPricing";
import "@/app/landing.css";

// Home page laid out like 1password.com: tan banner, white nav, dark hero with console screenshot, dark product section,
// blue report card, testimonial, dark CTA card, dark footer. Marks, copy and artwork are our own.
const REPO = "https://github.com/tommy-muckstack/onepasswordisdead";
const Logo = ({ h = 27, c = "#1d1d21" }: { h?: number; c?: string }) => <svg height={h} viewBox="0 0 196 28" aria-hidden><circle cx="14" cy="14" r="13" fill={c === "#fff" ? "#fff" : "#0572ec"} /><path d="M11.4 7.5h5.2v5.1c0 .9-.4 1.2-.9 2l-.5 3.5-1.2 0-.5-3.5c-.5-.8-.9-1.1-.9-2z" fill={c === "#fff" ? "#1d1d21" : "#fff"} transform="translate(0 0)" /><text x="34" y="21" fontFamily="IsDead DM Sans,sans-serif" fontSize="21" fontWeight="700" letterSpacing="-.8" fill={c}>1PasswordIsDead</text></svg>;
const Dn = () => <svg width="9" height="6" viewBox="0 0 9 6" aria-hidden style={{ marginLeft: 6 }}><path d="M1 1l3.5 3.5L8 1" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>;
const brands = ["Free","Open source","Apache-2.0","AES-256-GCM","PBKDF2","WebCrypto","TOTP codes","Passphrases","","","Breach check","Auto-lock","CSV import","Backups","","","Tags","Favorites","Search","Shortcuts","No plans","No card","No seats","Audit"];
const tiles: [string, string][] = [["Encrypted vault", "Logins, cards and secure notes, encrypted with AES-256-GCM in your browser before they are stored."], ["Password generator", "Random passwords and passphrases, with an optional k-anonymity check against known breaches."], ["One-time codes", "Keep TOTP secrets next to the login and copy the current code in one click."], ["Security audit", "Find weak, reused and old passwords so you know what to change first."]];
const tlink = ["Open the vault", "Generate a password", "Add a one-time code", "Run an audit"];
const foot: [string, string[]][][] = [
  [["Unified Access Platform", ["Unified Access", "Enterprise Password Manager", "Credential Broker", "Privileged Access", "SaaS Manager", "Device Trust"]], ["Products and Tools", ["Personal Password Manager", "Password generator", "Username generator", "Comparison", "Demos", "Switch", "Pricing"]]],
  [["Features", ["Autofill", "Access reviews", "Access requests", "Account governance", "Posture checks", "Extended Device Compliance", "SaaS Manager integrations", "SaaS discovery", "SaaS workflows", "IT Asset Management", "License management", "Watchtower insights", "Secrets Management", "Password sharing", "Two-factor authentication", "Passkeys"]]],
  [["Solutions", ["AI spend management", "Zero standing privileges", "Passwordless", "Device Security", "Shadow IT Discovery", "SaaS Access Governance", "SaaS Offboarding", "SaaS Spend Management", "Credential Management", "Cyber Insurance and Compliance", "Agentic AI Security"]]],
  [["Resources", ["Off-by-1 Labs", "Webinars", "Customer stories", "Resource library", "Blog", "Security", "Privacy"]], ["Developers", ["Developer documentation", "Developer Community", "Secrets management", "Bug bounty"]], ["Support", ["Help and Documentation", "Community", "Customer support", "Privacy support"]]],
  [["Company", ["About", "We're hiring!", "Press", "Podcast", "Newsletter", "Legal Center", "Trust Center"]], ["Partners", ["Partnerships Overview", "1Password for MSPs", "Password Manager - MSP Edition", "1Password Marketplace", "Affiliate", "For Students"]]],
];

export function Landing({ page }: { page?: "pricing" } = {}) {
  return <div className={"op" + (page === "pricing" ? " is-pr" : "")}>
    <div className="op-banner"><Link href="/pricing">1PasswordIsDead is free and open source, and not independently audited. Learn more →</Link><Link href="/login">Sign in</Link></div>
    <header className="op-nav"><Link href="/" className="op-logo"><Logo /></Link>
      <nav><button>Business<Dn /></button><button>Personal<Dn /></button><Link href="/pricing">Developers</Link><button>Partners<Dn /></button><button>Resources<Dn /></button><Link href="/pricing">Pricing</Link></nav>
      <div className="op-nav__r"><Link href="/pricing">See pricing</Link><Link href="/login" className="op-pill op-pill--blue">Get started free</Link></div></header>
    <section className="op-hero"><h1>A free password vault that encrypts in your browser</h1><p>Logins, cards, secure notes and one-time codes, encrypted with AES-256-GCM before they are stored. Free and open source.</p>
      <div className="op-row"><Link href="/login" className="op-pill op-pill--white">Get started free</Link><Link href="/pricing" className="op-pill op-pill--blue">Compare plans</Link></div>
      <div className="op-hero__stage" aria-hidden><div className="op-con"><div className="op-con__side">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div><div className="op-con__main"><b /><div className="op-con__card" /><div className="op-con__list">{Array.from({ length: 9 }, (_, i) => <i key={i}><s /><u /></i>)}</div></div></div></div>
      <div className="op-logos">{brands.map((b, i) => <span key={i}>{b}</span>)}<blockquote>Your vault is encrypted in your browser, with a key derived from your master password</blockquote></div></section>
    <section className="op-uni"><small>WHAT YOU GET</small><h2>One vault for your logins, cards and notes</h2><p>Everything is included, for free, with no plans to buy.</p><Link className="op-ul" href="/login">Explore the vault</Link>
      {tiles.map(([t, d], i) => <div key={t} className={"op-tile op-tile--" + i}><div className="op-tile__img" aria-hidden><i /><i /><i /></div><h3>{t}</h3><p>{d}</p><Link className="op-ul" href="/pricing">{tlink[i]}</Link></div>)}</section>
    <section className="op-gart"><small>OPEN SOURCE</small><h2>Read every line of the code</h2><p>1PasswordIsDead is Apache-2.0 on GitHub. It has not been independently audited, so read SECURITY.md before you store anything important.</p><div className="op-row"><a href={REPO} className="op-pill op-pill--black">View the source</a><a href={REPO + "/blob/main/SECURITY.md"} className="op-pill op-pill--line">Read SECURITY.md</a></div></section>
    <section className="op-story"><div className="op-story__img" aria-hidden /><div className="op-story__logo" aria-hidden><b>FREE</b><i>open</i></div><p className="op-quote">“Every feature is free. No seats, no plans and no trial that runs out.”</p><small>The 1PasswordIsDead promise<br />Apache-2.0 on GitHub</small><Link href="/pricing" className="op-pill op-pill--outline">See pricing</Link></section>
    <section className="op-ctrl"><h2>Bring your passwords under control</h2><p>Store logins, cards and notes in an encrypted vault, generate strong passwords, and find the weak or reused ones.</p><div className="op-row"><Link href="/login" className="op-pill op-pill--white">Get started free</Link><Link href="/pricing" className="op-pill op-pill--line op-pill--wl">View plans</Link></div></section>
    {page === "pricing" && <OpPricing />}
    <footer className="op-foot"><span className="op-foot__mark" aria-hidden /><button className="op-lang">English<Dn /></button>
      <div className="op-foot__cols">{foot.map((col, i) => <div key={i}>{col.map(([h, ls]) => <section key={h}><h5>{h}</h5>{ls.map(l => <Link key={l} href="/pricing">{l}</Link>)}</section>)}</div>)}</div>
      <aside className="op-dl"><h5>Downloads</h5>{[["Web app", "/login"], ["Source code", REPO]].map(([l, h]) => <Link key={l} href={h}>{l}</Link>)}</aside>
      <div className="op-foot__logo"><Logo h={52} c="#fff" /></div><hr />
      <nav className="op-legal"><Link href="/pricing">Terms of Service</Link><Link href="/pricing">Cookie Policy</Link><Link href="/pricing">Your Privacy Choices</Link><Link href="/pricing">Privacy Policy</Link><Link href="/pricing">Accessibility</Link><Link href="/pricing">Sitemap</Link></nav>
      <span className="op-soc">{["X", "M", "r", "▶", "⌥", "in", "◎", "⌁"].map(x => <a key={x} href={REPO}>{x}</a>)}</span>
      <p className="op-copy">© 2026 OnePasswordIsDead. An independent open-source project, not affiliated with 1Password.</p></footer>
  </div>;
}
