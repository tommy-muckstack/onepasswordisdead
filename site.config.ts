import type { Site } from "@/lib/site-types";
const GH = "https://github.com/tommy-muckstack/onepasswordisdead";
export const site: Site = {
  slug: "onepasswordisdead", name: "1PasswordIsDead", replaces: "1Password", theme: "onepassword",
  glyph: "M7 11 L7 8.5 A5 5 0 0 1 17 8.5 L17 11 M5.5 11 L18.5 11 L18.5 20 L5.5 20 Z M12 14.5 L12 16.5",
  nav: [{ label: "Product", id: "product" }, { label: "Solutions", id: "solutions" }, { label: "Resources", id: "resources" }, { label: "Pricing", id: "pricing" }],
  cta: "Create a free vault",
  hero: { variant: "split", eyebrow: "Free · Open source · Encrypted in your browser", title: ["Every password,", "one master password."], subtitle: "Store logins, cards and notes in a vault that is encrypted on your device before anything is saved. Generate strong passwords, fill in two-factor codes and audit what's weak, with no subscription.",
    primary: { label: "Open the demo", href: "/login" }, secondary: { label: "See pricing", href: "/#pricing" }, shot: "vault.png", shotAlt: "The 1PasswordIsDead vault showing a list of logins and the detail view of a login with a hidden password and a one-time code" },
  notice: "1PasswordIsDead is experimental software that has not been independently security audited. Your vault is encrypted in your browser and stored only there: there is no sync and no account recovery, so forgetting your master password or clearing site data loses everything. Keep backups, and don't make this the only copy of anything you can't afford to lose.",
  audience: "For people who want a password manager they can read, host themselves and trust because the code is open",
  stepsTitle: "Locked down in three steps",
  steps: [{ t: "Choose a master password", d: "It derives your encryption key on this device. We never see it and can't reset it." }, { t: "Add or import logins", d: "Create items by hand or import a CSV from the manager you're leaving." }, { t: "Keep it healthy", d: "A security audit flags weak, reused and old passwords, with an optional breach check." }],
  rows: [
    { id: "product", k: "Vault", h: "Logins, cards and notes in one searchable place", p: "Fast search, favorites, tags and keyboard shortcuts. Passwords stay hidden until you reveal them, and copied secrets are cleared from the clipboard after thirty seconds.", img: "vault.png", alt: "The vault with a list and a detail pane", cta: "Open the vault" },
    { id: "solutions", k: "Generator", h: "Passwords you couldn't guess if you tried", p: "Random passwords or memorable passphrases from the browser's cryptographic random generator, with the entropy shown honestly.", img: "generator.png", alt: "The password generator with length and character options", cta: "Generate one" },
    { id: "resources", k: "Security audit", h: "Know which passwords to fix first", p: "See weak, reused and year-old passwords at a glance. Optionally check them against known breaches without sending a single password anywhere.", img: "audit.png", alt: "The security audit showing a health score and lists of weak and reused passwords", cta: "Run an audit" },
  ],
  statsTitle: "What “free” and “private” mean here",
  stats: [{ b: "$0", s: "per person, per month, forever" }, { b: "AES-256-GCM", s: "with a PBKDF2-SHA256 derived key" }, { b: "0 bytes", s: "of your vault ever sent to a server" }, { b: "Apache-2.0", s: "read every line that touches your secrets" }],
  integrations: { title: "Bring your passwords with you", text: "Import a CSV from your current manager, or export an encrypted backup. Open formats, no lock-in." },
  pricing: { title: "What you'd pay for a password manager elsewhere", vendor: "1Password", asOf: "October 2026", plans: [{ name: "Individual", perSeatMonth: 3, note: "billed annually, per person" }, { name: "Families (5 people)", perSeatMonth: 5, flat: true, note: "billed annually, flat" }], seats: 5,
    footnote: "1Password has no free plan after its trial. Be honest with yourself about what you give up: no sync across devices, no browser extension, no account recovery, no independent security audit. Use us to learn, or for low-stakes secrets.", featuresTitle: "What you get, with no plan gates",
    features: [{ name: "Unlimited logins, cards and notes", plan: "Individual" }, { name: "Password generator and passphrases", plan: "Individual" }, { name: "One-time passwords (TOTP)", plan: "Individual" }, { name: "Security audit with optional breach check", plan: "Individual" }, { name: "Encrypted backup and CSV import", plan: "Individual" }, { name: "Cross-device sync", plan: "Individual" }] },
  finalCta: { title: "Your secrets, your browser.", sub: "Create a vault in under a minute. Read the security notes first." },
  footer: [
    { title: "Product", links: [{ label: "Vault", href: "/#product" }, { label: "Generator", href: "/#solutions" }, { label: "Security audit", href: "/#resources" }, { label: "Pricing", href: "/#pricing" }] },
    { title: "Get started", links: [{ label: "Log in", href: "/login" }, { label: "Try the demo account", href: "/login" }, { label: "Price comparison", href: "/#pricing" }] },
    { title: "Open source", links: [{ label: "GitHub", href: GH }, { label: "Security notes", href: GH + "/blob/main/SECURITY.md" }, { label: "Apache-2.0 license", href: GH + "/blob/main/LICENSE" }] },
    { title: "More IsDead apps", links: [{ label: "NotionIsDead", href: "/notionisdead" }, { label: "LinearIsDead", href: "/linearisdead" }, { label: "AirtableIsDead", href: "/airtableisdead" }, { label: "OtterIsDead", href: "/otterisdead" }] },
  ],
  trademark: "1PasswordIsDead is an independent open-source project. It is not affiliated with, endorsed by or sponsored by AgileBits Inc. or 1Password. 1Password is a trademark of its owner. This software is experimental and has not been security audited.",
  repo: GH,
};
