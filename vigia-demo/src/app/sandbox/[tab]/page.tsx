import SandboxShell from "../SandboxShell";

interface Props {
  params: { tab: string };
}

export default function Page({ params }: Props) {
  return <SandboxShell initialTab={params.tab} />;
}