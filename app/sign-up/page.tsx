import { redirect } from "next/navigation";
// Mirrors the original: /sign-up lands on the pricing page.
export default function SignUp() { redirect("/pricing"); }
