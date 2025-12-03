import SandboxShell from "../SandboxShell";

interface Props {
  params: { tab: string } | Promise<{ tab: string }>;
}

export default async function Page({ params }: Props) {
  const p = await params;
  return <SandboxShell initialTab={p.tab} />;
}
