import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isDashboard = !isAuthRoute && pathname !== "/";

  if (!user && isDashboard) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost";
    const proto = request.headers.get("x-forwarded-proto") || "https";
    return NextResponse.redirect(`${proto}://${host}/login`);
  }

  if (user && isAuthRoute) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost";
    const proto = request.headers.get("x-forwarded-proto") || "https";
    return NextResponse.redirect(`${proto}://${host}/native`);
  }

  return supabaseResponse;
}
