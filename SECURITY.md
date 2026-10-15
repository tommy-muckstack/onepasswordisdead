# Security notes

**1PasswordIsDead is experimental and has not been independently audited. Do not rely on it as the only copy of anything important.**

## Design
- Master password → PBKDF2-HMAC-SHA256 (600,000 iterations, random 16-byte salt) → AES-256-GCM key, created with `extractable: false` via WebCrypto.
- The whole vault is one JSON document encrypted with a fresh random 96-bit IV on every save. The format version, KDF name, iteration count and salt are bound in as GCM additional authenticated data, so tampering with them fails decryption.
- Only the ciphertext blob (and the non-secret auto-lock preference) is written to `localStorage`. The master password and derived key live in memory and are dropped on lock, auto-lock (1–60 minutes idle), sign-out or page reload.
- Passwords are never searched, logged or sent anywhere. The optional breach check sends only the first 5 hex characters of a password's SHA-1 to the Have I Been Pwned range API (k-anonymity) and only when you press the button.
- Copied secrets are cleared from the clipboard after 30 seconds (best effort). Revealed passwords hide again after 15 seconds.
- Generated passwords use `crypto.getRandomValues` with rejection sampling (no modulo bias).

## What it does not protect against
- Malware, keyloggers or a malicious browser extension on your device.
- A compromised or malicious script running on the same web origin while the vault is unlocked. If you host this next to other apps, use a dedicated origin.
- A weak master password. PBKDF2 slows guessing but does not stop it. Use a long passphrase.
- Loss: there is no recovery, no sync and no server copy. Download an encrypted backup (Settings) and keep it somewhere safe.
- Browsers can clear site data under storage pressure or when you ask them to.

## Known limitations
- PBKDF2 rather than a memory-hard KDF (Argon2/scrypt aren't in WebCrypto). No secret key / two-secret derivation.
- No browser extension, autofill, sharing, emergency access or passkey support.
- Demo accounts use a documented master password and sample data. Never put real secrets in the demo vault.

## Reporting
Open an issue on the repository, or email the maintainer privately for anything sensitive.
