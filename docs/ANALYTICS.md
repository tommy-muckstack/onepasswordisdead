# Analytics (PostHog)

One PostHog project (US cloud, project **666931**) collects the hub and every IsDead sub-app. The contract is the hub's
`yourappisdead/ANALYTICS.md`; this file is how OnePasswordIsDead follows it.

## Privacy rule for this app (stricter than the hub contract)
OnePasswordIsDead is a password manager. Analytics must never be able to describe or fingerprint a vault:
- No item titles, usernames, URLs, notes, tags, TOTP data, search text, file names or emails. Ever.
- No vault-shape properties: no item counts, tag counts, audit results (weak/reused/breached counts), import counts,
  generator options (length, character sets, word count) or auto-lock settings.
- Item events carry no properties at all (no kind, no create/edit split, no deletes). Most events carry none.
- Autocapture, session replay, heatmaps, dead-click capture, exception autocapture, performance capture and surveys are
  all off in `lib/analytics/posthog.tsx`.
- `scrub` (posthog-js `before_send`, `lib/analytics/posthog.tsx`) runs on every event:
  - every URL-like property (`$current_url`, `$referrer`, `$pathname`, `$initial_*`, `$session_entry_*`, and anything else
    ending in `url` / `referrer` / `pathname`, including inside `$set` / `$set_once`) keeps only origin + path: query strings
    and hashes are dropped;
  - `PRIVATE_PATHS` masks everything below `/app/` as `/app/:id` (vault and item ids live only in memory today and never
    reach the URL; this keeps it that way if routes are ever added);
  - the page `title` property is deleted.
- `$pageview` is sent with no hand-built properties; `scrub` cleans what posthog-js adds. `tests/unit/analytics.test.ts`
  covers query/hash/title stripping, `/app/` masking and the `$session_entry_*` props.

## Setup
- `NEXT_PUBLIC_POSTHOG_KEY` (publishable project token) and `NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com` are set on
  Vercel. No key → analytics is a no-op.
- Reverse proxy: `/onepasswordisdead/ingest/*` → `us.i.posthog.com` (rewrites in `next.config.mjs`, with
  `skipTrailingSlashRedirect: true`).
- `<Analytics />` in `app/layout.tsx` boots the client and sends PostHog's `$pageview` per route change.
- posthog-js drops automated browsers; in dev only, `localStorage.isdead_ph_debug = "1"` enables verbose logs and lets
  Playwright capture (used by the verification script).

## Super properties
| property | value |
| --- | --- |
| `product` | `onepasswordisdead` |
| `surface` | `landing` (home, pricing, compare, login, sign-up) \| `app` (`/app`) |
| `platform` | `web` |
| `env` | `production` \| `development` |
| `account_type` | `firebase` \| `guest` \| `demo` |

## Identity
Signed-in users are identified by Firebase uid (`account_type: "firebase"`) when the vault workspace mounts. Guests and the
demo account are never identified; only `account_type` is registered. Sign-out sends `app_signed_out` then calls `reset()`
and re-registers the super properties.

## Events
| event | properties | where |
| --- | --- | --- |
| `app_signed_up` | `method`: password | `components/useAuth.ts` |
| `app_signed_in` | `method`: password \| google | `components/useAuth.ts` |
| `app_signed_out` | | `components/AppShell.tsx` |
| `app_vault_created` | | `components/vault/Workspace.tsx` |
| `app_vault_unlocked` | | `Workspace.tsx` |
| `app_vault_locked` | `auto` (bool: idle timer vs. Lock now) | `Workspace.tsx` |
| `app_item_saved` | none (no create/edit split, no deletes, no item kind: together those would reveal a vault's size and shape) | `Workspace.tsx` |
| `app_password_generated_copied` | | `components/vault/Tools.tsx` (Generator) |
| `app_backup_downloaded` | | `Tools.tsx` (Settings) |
| `app_logins_imported` | | `Workspace.tsx` |
| `app_master_password_changed` | | `Workspace.tsx` |

Adding an event = add it to `lib/analytics/taxonomy.ts` (the only place names are defined) and this table, and check it
against the privacy rule above. `tests/unit/analytics.test.ts` rejects names outside `app_` / `landing_` and names
containing the product.
