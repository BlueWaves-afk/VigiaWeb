// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/** Bridge Supabase cookies in middleware (per Supabase SSR pattern) */
async function getSupabaseAndResponse(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Mirror cookie mutations to the response
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Touch the session to refresh if needed
  await supabase.auth.getUser().catch(() => { /* ignore */ });

  return { supabase, response };
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = await getSupabaseAndResponse(request);
  const url = new URL(request.url);
  const path = url.pathname;

  // Let Supabase auth callbacks pass through without redirects
  if (path.startsWith("/auth/callback")) return response;

  // Get the current user (reads from cookies set above)
  const { data: { user } = { user: null } } = await supabase.auth.getUser();

  // Routes that require auth
  const requiresAuth =
    path.startsWith("/dashboard") ||
    path === "/datasets" ||
    path.startsWith("/datasets/");

  if (!user && requiresAuth) {
    const redirectTo = new URL("/auth/signin", request.url);
    // preserve where the user intended to go
    redirectTo.searchParams.set("redirectedFrom", path);
    return NextResponse.redirect(redirectTo);
  }

  // If already signed in, keep auth pages out of the way
  const isAuthPage =
    path.startsWith("/auth/signin") || path.startsWith("/auth/signup");
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

/**
 * Match everything except:
 *  - next internals & static
 *  - public favicons/images
 *  - your model/video/wasm buckets (avoid intercepting big files)
 *  - robots/sitemap
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.png|site.webmanifest|robots.txt|sitemap.xml|images/|public/|ort/|models/|demo/).*)",
  ],
};