# 1PasswordIsDead

Free, open-source password vault that encrypts everything in your browser. Part of [IsDead](https://yourappisdead.com): open-source clones of paid SaaS. Served at `https://yourappisdead.com/onepasswordisdead`.

**Experimental and not independently audited. Read [SECURITY.md](SECURITY.md) before storing anything you can't afford to lose.**

- **Homepage** (`/`): mirrors 1Password's homepage structure (hero, audience line, steps, feature rows, stats, price comparison at `#pricing`) with original copy and art.
- **Login** (`/login`): shared IsDead Firebase auth (email/password + Google); one demo account in demo mode.
- **Vault** (`/app`): create a vault with a master password (PBKDF2-SHA256, 600k iterations, AES-256-GCM via WebCrypto); logins, cards, secure notes; search, favorites, tags, keyboard shortcuts; reveal/copy with clipboard auto-clear; TOTP codes; password generator and passphrases; security audit (weak, reused, old, optional k-anonymity breach check); CSV import and encrypted backup; auto-lock.
- **Autofill-like copy:** one-click copy of username, password and one-time code from the item detail. There is no browser extension.

Design: theme `onepassword` in `vendor/isdead-design` (canonical `/workspace/isdead-design`); an OFL lookalike font.

## Run

```
npm ci
npm run dev            # http://localhost:3000/onepasswordisdead  (demo account in dev)
npm test && npm run typecheck
npm run build && npm run shots   # production smoke test (vault creation, encryption at rest, items, TOTP, generator, audit, backup) + screenshots
```

Env (production): `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_SERVICE_ACCOUNT_JSON`, optional `DEMO_MODE=1`.

## Auth
Shared Firebase project `yourappisdead`, helpers in `lib/isdead-auth`. The session cookie `isdead_session` has path `/`, so one sign-in covers every IsDead app. Signing in identifies you to the site only; it never unlocks the vault. The vault is unlocked solely by the master password.

## Gaps
- No cross-device sync, no browser extension, no account recovery, no sharing between people, no passkeys.
- The vault lives in `localStorage` of one browser; clearing site data deletes it. Download backups.
- Not independently audited.

Not affiliated with 1Password or AgileBits. Apache-2.0.

## Open source & contributing
Each IsDead app is its own public repo so people can contribute individually. Rules: original assets only (no copied logos, art, copy or code), shared Firebase auth, shared design system ([isdead-design](https://github.com/tommy-muckstack/isdead-design)) with an OFL lookalike font, free and mobile-first (360px), reduced-motion safe. See the marketplace repo [yourappisdead](https://github.com/tommy-muckstack/yourappisdead) for CONTRIBUTING and how to submit an app to kill.
