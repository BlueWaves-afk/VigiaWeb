import SandboxShell from "./SandboxShell";

export default function SandboxIndex() {
  // Default landing demo; can be changed to "aegis" or any other key from NAV.
  return <SandboxShell initialTab="v2x" />;
}