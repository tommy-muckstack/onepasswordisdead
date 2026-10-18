import { describe, it, expect } from "vitest";
import { EVENTS, EVENT_PREFIXES, APP, superProps } from "@/lib/analytics/taxonomy";
describe("analytics taxonomy", () => {
  it("uses the shared prefixes and snake_case", () => { for (const e of Object.values(EVENTS)) { expect(e, e).toMatch(/^[a-z]+(_[a-z]+)+$/); expect(EVENT_PREFIXES.some(p => e.startsWith(p)), e).toBe(true); } });
  it("never puts the product name in an event name", () => { for (const e of Object.values(EVENTS)) expect(e.includes(APP.replace(/isdead$/, ""))).toBe(false); });
  it("sends the hub's super properties", () => { expect(superProps("app")).toEqual({ product: APP, surface: "app", platform: "web" }); });
});
import { scrub } from "@/lib/analytics/posthog";
describe("analytics privacy", () => {
  it("strips query strings, hashes and titles", () => {
    const e = scrub({ event: "$pageview", properties: { $current_url: "https://yourappisdead.com/x/app?url=https://secret.example#frag", $referrer: "https://google.com/search?q=me", title: "My private doc" } });
    expect(e.properties.$current_url).toBe("https://yourappisdead.com/x/app"); expect(e.properties.$referrer).toBe("https://google.com/search"); expect("title" in e.properties).toBe(false);
  });
  it("masks anything below /app/ (vault or item ids if they ever reach the URL)", () => {
    const e = scrub({ event: "$pageview", properties: { $current_url: "https://yourappisdead.com/onepasswordisdead/app/vault-123/item/abc?x=1", $pathname: "/onepasswordisdead/app/item/abc" }, $set: { $current_url: "https://yourappisdead.com/onepasswordisdead/app/item/abc" } });
    expect(e.properties.$current_url).toBe("https://yourappisdead.com/onepasswordisdead/app/:id"); expect(e.properties.$pathname).toBe("/onepasswordisdead/app/:id"); expect(e.$set.$current_url).toBe("https://yourappisdead.com/onepasswordisdead/app/:id");
    expect(scrub({ properties: { $current_url: "https://yourappisdead.com/onepasswordisdead/app" } }).properties.$current_url).toBe("https://yourappisdead.com/onepasswordisdead/app");
  });
});
describe("analytics privacy: session entry props", () => {
  it("cleans $session_entry_* and any other url-ish property", () => {
    const e = scrub({ properties: { $session_entry_url: "https://yourappisdead.com/onepasswordisdead/?foo=bar", $session_entry_referrer: "https://x.example/?q=1", $some_future_url: "https://a.example/p#h" } });
    expect(e.properties.$session_entry_url).toBe("https://yourappisdead.com/onepasswordisdead/"); expect(e.properties.$session_entry_referrer).toBe("https://x.example/"); expect(e.properties.$some_future_url).toBe("https://a.example/p");
  });
});
