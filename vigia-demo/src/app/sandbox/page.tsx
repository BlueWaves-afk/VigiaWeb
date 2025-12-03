import { redirect } from "next/navigation";

export default function SandboxIndex() {
  // Redirect to a default demo page — change this if you prefer a different default
  redirect("/sandbox/v2x");
}