// src/app/auth/cookies/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export async function GET() {
  const c = await (cookies() as any).then?.call ? await (cookies() as any) : cookies();
const all: string[] = c.getAll().map((k: { name: string }) => k.name);
  return NextResponse.json({ cookieNames: all });
}
// visit http://localhost:3000/auth/cookies
// You should see: ["sb-access-token","sb-refresh-token", ...]