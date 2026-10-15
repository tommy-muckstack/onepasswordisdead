import type { PBCfg } from "@/components/PricingBody";
export const pricingCfg: PBCfg = {
  vars: { "--plan-min": "260px", "--gap": "0px", "--plan-bd": "1px solid #d0d3da", "--ink": "#1d1d21", "--accent": "#145fe4", "--soft": "#f2f4f9", "--hero-pt": "72px", "--hero-pb": "44px", "--hero-align": "left", "--hero-ml": "96px", "--h1": "56px", "--h1-lh": "1.1", "--h1-ls": "-1px", "--h-weight": "300", "--card-r": "8px", "--btn-r": "9999px", "--plan-h2": "20px", "--plan-h2-lh": "26px", "--row": "44px", "--faq-bg": "#1d1d21", "--faq-card": "transparent", "--faq-ink": "#fff", "--max": "1248px" } as Record<string, string>,
  title: "Pricing and plans for Enterprise",
  plans: [
    { name: "Unified Access", price: "Free", desc: "Identity security for humans, AI agents, and machines", cta: "Request a quote", feats: ["One seat for every identity", "Shadow IT and SaaS usage", "Just-in-time privileged access", "Business-grade reporting"] },
    { name: "Enterprise Password Manager", price: "Free", desc: "Protect every credential that keeps your business running", cta: "Request a quote", feats: ["Unlimited vaults", "Admin controls", "SSO integrations", "Activity log"] },
    { name: "SaaS Manager", price: "Free", desc: "Discover, secure, and optimize every app", cta: "Request a quote", feats: ["App discovery", "Spend insights", "Offboarding workflows"] },
    { name: "Privileged Access", price: "Free", desc: "Zero standing privileges, just-in-time", cta: "Request a quote", feats: ["Approval flows", "Session recording", "Break-glass access"] },
    { name: "Device Trust", price: "Free", desc: "Ensure only trusted devices can access your company resources", cta: "Request a quote", feats: ["Device health checks", "Posture rules", "Compliance reports"] },
  ],
  tableTitle: "Unleash productivity without compromising security", cols: ["Unified Access", "Password Manager", "SaaS Manager", "Privileged Access"],
  groups: [["Passwordless", ["Passkeys", "Biometric unlock", "SSO"]], ["Device security", ["Device health", "OS updates"]], ["Credential risk", ["Watchtower", "Breach alerts"]]],
  faqTitle: "Frequently Asked Questions", faqs: [["Can I buy Unified Access as a platform or purchase individual products separately?", "Everything here is free and open source."], ["Does Unified Access work with existing identity and security tools?", "Yes, via SSO and standard protocols."], ["How do I get pricing for Unified Access?", "There is nothing to buy. Use it for free."], ["Which products are included in the Unified Access platform?", "All of them: password manager, SaaS manager, privileged access and device trust."], ["How is Unified Access different from Enterprise Password Manager?", "It adds SaaS discovery, just-in-time privileges and device trust."]],
  fillMobile: 0,
};
