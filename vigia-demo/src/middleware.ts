import { createMiddlewareClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // This is REQUIRED to refresh and sync the auth session
  await supabase.auth.getSession();

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
