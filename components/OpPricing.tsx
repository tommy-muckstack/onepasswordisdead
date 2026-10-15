import Link from "next/link";
import "@/app/op-pricing.css";

const plans: { k: string; n: string; d: string; f: string[] }[] = [
  { k: "PLATFORM", n: "Unified Access", d: "Identity security for humans, AI agents, and machines.", f: ["One vault for every identity", "Shadow AI and SaaS discovery", "Just-in-time Privileged Access", "Runtime credentials for AI agents", "Full-attribution audit trail"] },
  { k: "PRODUCT", n: "Enterprise Password Manager", d: "Protect every credential that keeps your business running.", f: ["Protect apps outside SSO", "Granular vault permissions", "Multi-tenant support", "Developer toolkit", "Audit-ready activity logs"] },
  { k: "PRODUCT", n: "SaaS Manager", d: "Discover, secure access, and optimize AI and SaaS spend.", f: ["Control variable AI spend", "SaaS & AI app discovery", "Automate on/offboarding", "Optimize SaaS spend", "No-code workflows", "400+ integrations"] },
  { k: "PRODUCT", n: "Privileged Access", d: "Just-in-time and just-enough privileged access.", f: ["Zero standing privileges", "Cloud, K8s, and database support", "Intent-based dynamic guardrails", "Audit-ready session logs", "AI agent privilege control enforced at runtime"] },
  { k: "PRODUCT", n: "Device Trust", d: "Ensure only trusted devices access company resources.", f: ["Device health monitoring", "Pre-built check library", "Guided self-remediation", "IdP Integrations", "Cross-platform support"] },
];
const tiles: [string, string][] = [
  ["Passwordless", "Uncover password risk and guide your team’s journey toward a passwordless future."],
  ["Device security", "Verify every device is trusted. Let users self-remediate to restore compliance and access."],
  ["Credential risk management", "Protect credentials with a zero-knowledge password manager and reduce shadow IT exposure."],
  ["SaaS and shadow IT discovery", "Discover all apps, managed or unmanaged, used across your organization."],
  ["SaaS governance", "Automate access, cut spend, and stay compliant across every SaaS app."],
  ["Cybersecurity compliance", "Enforce strong access policies, secure devices, and meet audit and regulatory needs."],
];
const faqs: [string, string][] = [
  ["Can I buy Unified Access as a platform or purchase individual products separately?", "Yes. Unified Access can be purchased as an integrated platform, and individual products within the platform can also be purchased separately based on your organization’s needs."],
  ["Which products are included in the Unified Access platform?", "Unified Access brings together Enterprise Password Manager, Device Trust, SaaS Manager, and Privileged Access in one platform."],
  ["How is Unified Access different from Enterprise Password Manager?", "Enterprise Password Manager helps organizations protect and manage credentials. Unified Access builds on those capabilities to help govern access across people, AI agents, and machines."],
  ["Does Unified Access work with existing identity and security tools?", "Yes. Unified Access is designed to work with your existing identity and security environment. Explore available integrations in the 1Password Marketplace, or contact our sales team to discuss your specific tools and requirements."],
  ["How do I get pricing for Unified Access?", "Unified Access pricing is tailored to your organization’s needs and the capabilities you require. Contact our sales team to discuss your environment and receive a quote."],
];
const Plus = () => <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" fill="none" /></svg>;
const Minus = () => <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden><path d="M5 12h14" stroke="currentColor" strokeWidth="1.6" fill="none" /></svg>;
const Faq = ({ i }: { i: number }) => <details open={i === 0}><summary><h3>{faqs[i][0]}</h3><span className="p"><Plus /></span><span className="m"><Minus /></span></summary><div><p>{faqs[i][1]}</p></div></details>;

export function OpPricing() {
  return <main className="opp">
    <section className="opp-hero"><h1>Pricing and plans for</h1><button className="opp-sel" type="button">Enterprise<svg width="48" height="48" viewBox="0 0 48 48" aria-hidden><path d="M14 19l10 10 10-10" stroke="currentColor" strokeWidth="2.4" fill="none" /></svg></button></section>
    <section className="opp-plans"><div>{plans.map(p => <article key={p.n}>
      <header><h2>{p.k}</h2><h3>{p.n}</h3><p>{p.d}</p></header>
      <Link className="opp-btn" href="/login">Request a quote</Link>
      <ul>{p.f.map(f => <li key={f}>{f}</li>)}</ul></article>)}</div></section>
    <section className="opp-aws"><h3>Additional ways to buy</h3><div className="opp-aws__c">
      <div className="opp-aws__l"><div><h3>Purchase 1Password via AWS Marketplace</h3><span className="opp-awsm"><i>available in</i><b>aws</b><em>marketplace</em></span></div><Link className="opp-btn" href="/login">Buy with AWS</Link></div>
      <div className="opp-aws__r"><div><div>The benefits of Buy with AWS:</div><ul><li>Simplified procurement</li><li>Consolidated billing</li><li>Scalable and flexible deployment</li></ul></div></div></div></section>
    <section className="opp-unl"><h2>Unleash productivity without compromising security</h2><div>{tiles.map(([t, d]) => <article key={t}><h4>{t}</h4><p>{d}</p></article>)}</div></section>
    <section className="opp-faq"><h2>Frequently Asked Questions</h2><div><div><Faq i={0} /><Faq i={1} /><Faq i={2} /></div><div><Faq i={3} /><Faq i={4} /></div></div></section>
  </main>;
}
