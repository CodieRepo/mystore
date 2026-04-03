import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  let response = NextResponse.next({ request });

  // -----------------------------------
  // 1. UTM Parameter Capture
  // -----------------------------------
  const utmSource = searchParams.get("utm_source");
  const utmMedium = searchParams.get("utm_medium");
  const utmCampaign = searchParams.get("utm_campaign");
  const utmContent = searchParams.get("utm_content");

  if (utmSource) {
    response.cookies.set("utm_source", utmSource, { maxAge: 60 * 60 * 24 * 30, path: "/" });
  }
  if (utmMedium) {
    response.cookies.set("utm_medium", utmMedium, { maxAge: 60 * 60 * 24 * 30, path: "/" });
  }
  if (utmCampaign) {
    response.cookies.set("utm_campaign", utmCampaign, { maxAge: 60 * 60 * 24 * 30, path: "/" });
  }
  if (utmContent) {
    response.cookies.set("utm_content", utmContent, { maxAge: 60 * 60 * 24 * 30, path: "/" });
  }

  // -----------------------------------
  // 2. Admin Route Protection
  // -----------------------------------
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify user is in admin_users table
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id, role, is_active")
      .eq("id", user.id)
      .single();

    if (!adminUser || !adminUser.is_active) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match admin routes
    "/admin/:path*",
    // Match store pages for UTM capture (not API or static assets)
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
