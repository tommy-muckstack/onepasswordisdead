import type { AuthCfg } from "@/components/AuthScreen";
export const authCfg: AuthCfg = { layout: "center", accent: "#0572ec", ctaBg: "#0572ec", radius: 8, ink: "#1d1d21", muted: "#5b5d66", logoCenter: true, logoSize: 34,
  title: "Sign in", signupTitle: "Create your account", emailLabel: "Email", emailFirst: true, providersAfter: true, ctaNext: "Continue", cta: "Sign in",
  providers: [{ id: "google", label: "Continue with Google", signupLabel: "Sign up with Google" }, { id: "passkey", label: "Sign in with passkey" }, { id: "sso", label: "Sign in with SSO" }],
  switchText: ["New to 1Password?", "Create an account"], signupSwitchText: ["Already have an account?", "Sign in"] };
