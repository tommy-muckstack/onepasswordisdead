// Analytics taxonomy for the shared IsDead PostHog project 666931 (contract: yourappisdead/ANALYTICS.md, see docs/ANALYTICS.md).
// Super properties: product (this app's slug), surface ("landing" = logged-out marketing pages, "app" = the working product
// and anything it publishes), platform ("web"). Page views are PostHog's built-in $pageview.
// Events are `app_<object>_<action>` (or `landing_<object>_<action>` for marketing CTAs); the product name lives in
// `product`, never in an event name. Never send user content (titles, URLs, emails, text) as properties.
export const APP = "onepasswordisdead" as const;
export type Surface = "landing" | "app";
export const EVENTS = {
  app_signed_up: "app_signed_up",       // method ("password" | "google")
  app_signed_in: "app_signed_in",       // method ("password" | "google")
  app_signed_out: "app_signed_out",
  // ---- vault (privacy: never titles, usernames, URLs, notes, tags, search text, generator options or vault-shape
  // properties; items carry none at all) ----
  app_vault_created: "app_vault_created",          // (no properties)
  app_vault_unlocked: "app_vault_unlocked",        // (no properties)
  app_vault_locked: "app_vault_locked",            // auto (bool: idle timer vs. Lock now)
  app_item_saved: "app_item_saved",                // no properties: created vs edited, deletes and item kinds would add up to a vault's size and shape
  app_password_generated_copied: "app_password_generated_copied", // (no properties)
  app_backup_downloaded: "app_backup_downloaded",  // (no properties)
  app_logins_imported: "app_logins_imported",      // (no properties: no counts)
  app_master_password_changed: "app_master_password_changed", // (no properties)
  landing_cta_clicked: "landing_cta_clicked", // target ("signup" | "app" | "pricing" | ...)
} as const;
export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
export const EVENT_PREFIXES = ["app_", "landing_"] as const;
/** Super properties every event carries (yourappisdead/ANALYTICS.md §1). */
export const superProps = (surface: Surface) => ({ product: APP, surface, platform: "web" as const });
/** Super properties older IsDead taxonomies persisted in the shared yourappisdead.com cookie. Unregistered at boot. */
export const LEGACY_PROPS = ["app", "app_family", "base_path", "suite_id", "app_id", "schema_version", "source", "site_id", "environment", "ads_blocked", "account_type"] as const;
