import type { ShellCfg } from "@/components/AppShell";
export const shellCfg: ShellCfg = { mode: "top", vars: { "--accent": "#0572ec", "--page": "#f5f6fa", "--top-bg": "#fff", "--top-h": "64px", "--r": "8px", "--top-ink": "#1d1d21" } as Record<string, string>,
  items: [{ label: "All items", href: "/app", icon: "key" }, { label: "Watchtower", href: "/app#watchtower", icon: "shield" }, { label: "Tools", href: "/app#tools", icon: "settings" }],
  search: "Search in all vaults", right: [{ label: "New Item", href: "/app#new", solid: true }] };
