import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";

const PROTECTED = [/^\/dashboard/, /^\/editor\//, /^\/admin/, /^\/account/];

/** Refreshes the Supabase session cookie and keeps signed-out visitors out of private pages. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { supabaseUrl: url, supabaseKey: key } = publicEnv;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // getClaims() validates the JWT signature; never trust an unverified session here.
  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims?.sub;

  const path = request.nextUrl.pathname;
  if (!signedIn && PROTECTED.some((r) => r.test(path))) {
    const to = request.nextUrl.clone();
    to.pathname = "/sign-in";
    to.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(to);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|sitemap.xml|robots.txt|api/webhooks|api/inngest|.*\\.(?:png|jpg|jpeg|webp|svg|ico)$).*)"],
};
