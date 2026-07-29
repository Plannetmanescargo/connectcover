import { NextRequest, NextResponse } from "next/server";

const MAINTENANCE_COOKIE_NAME = "coverza_maintenance_bypass";
const MAINTENANCE_BYPASS_PARAM = "maintenance_bypass";

function maintenanceEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE === "true";
}

function hasValidBypassCookie(req: NextRequest): boolean {
  const configuredSecret =
    process.env.MAINTENANCE_BYPASS_SECRET?.trim();

  if (!configuredSecret) {
    return false;
  }

  return (
    req.cookies.get(MAINTENANCE_COOKIE_NAME)?.value ===
    configuredSecret
  );
}

function isAlwaysAllowedPath(pathname: string): boolean {
  return (
    // Maintenance page and its assets
    pathname === "/maintenance.html" ||
    pathname.startsWith("/brand/") ||

    // Apple Pay domain verification
    pathname.startsWith("/.well-known/") ||

    // All backend routes, including:
    // - Square checkout
    // - Square webhook
    // - internal PDF rendering
    pathname.startsWith("/api/")
  );
}

export function middleware(req: NextRequest) {
  const { pathname, hostname } = req.nextUrl;

  /*
   * Force the canonical www hostname first.
   *
   * Doing this before maintenance handling ensures that any maintenance
   * bypass cookie is created on www.coverza.co.uk, where the main site runs.
   */
  if (hostname === "coverza.co.uk") {
    const canonicalUrl = req.nextUrl.clone();

    canonicalUrl.hostname = "www.coverza.co.uk";

    return NextResponse.redirect(canonicalUrl, 308);
  }

  /*
   * Private maintenance bypass.
   *
   * Open:
   * https://www.coverza.co.uk/?maintenance_bypass=YOUR_SECRET
   *
   * A secure HTTP-only cookie is stored, then the secret is removed from
   * the visible URL.
   */
  const suppliedBypassSecret = req.nextUrl.searchParams
    .get(MAINTENANCE_BYPASS_PARAM)
    ?.trim();

  const configuredBypassSecret =
    process.env.MAINTENANCE_BYPASS_SECRET?.trim();

  if (
    maintenanceEnabled() &&
    configuredBypassSecret &&
    suppliedBypassSecret === configuredBypassSecret
  ) {
    const cleanUrl = req.nextUrl.clone();

    cleanUrl.searchParams.delete(
      MAINTENANCE_BYPASS_PARAM
    );

    const response = NextResponse.redirect(cleanUrl);

    response.cookies.set({
      name: MAINTENANCE_COOKIE_NAME,
      value: configuredBypassSecret,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return response;
  }

  /*
   * Maintenance mode.
   *
   * Everyone without the private bypass cookie sees maintenance.
   * API routes and machine-verification files remain available.
   */
  if (
    maintenanceEnabled() &&
    !isAlwaysAllowedPath(pathname) &&
    !hasValidBypassCookie(req)
  ) {
    const maintenanceUrl = req.nextUrl.clone();

    maintenanceUrl.pathname = "/maintenance.html";
    maintenanceUrl.search = "";

    return NextResponse.rewrite(maintenanceUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};