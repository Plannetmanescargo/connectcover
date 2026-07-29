import { NextRequest, NextResponse } from "next/server";

const MAINTENANCE_COOKIE_NAME =
  "coverza_maintenance_bypass";

const MAINTENANCE_BYPASS_PARAM =
  "maintenance_bypass";

function maintenanceEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_MAINTENANCE ===
    "true"
  );
}

function hasValidBypassCookie(
  req: NextRequest
): boolean {
  const configuredSecret =
    process.env.MAINTENANCE_BYPASS_SECRET?.trim();

  if (!configuredSecret) {
    return false;
  }

  return (
    req.cookies.get(
      MAINTENANCE_COOKIE_NAME
    )?.value === configuredSecret
  );
}

function isWellKnownPath(
  pathname: string
): boolean {
  return pathname.startsWith("/.well-known/");
}

function isAlwaysAllowedPath(
  pathname: string
): boolean {
  return (
    pathname === "/maintenance.html" ||
    pathname.startsWith("/brand/") ||
    isWellKnownPath(pathname) ||
    pathname.startsWith("/api/")
  );
}

export function middleware(
  req: NextRequest
) {
  const { pathname, hostname } =
    req.nextUrl;

  /*
   * Apple Pay domain verification must be served directly
   * from the exact requested hostname.
   *
   * Do not redirect:
   *
   * coverza.co.uk/.well-known/...
   *
   * to:
   *
   * www.coverza.co.uk/.well-known/...
   */
  if (isWellKnownPath(pathname)) {
    return NextResponse.next();
  }

  /*
   * Force the normal website onto the canonical www hostname.
   */
  if (hostname === "coverza.co.uk") {
    const canonicalUrl =
      req.nextUrl.clone();

    canonicalUrl.hostname =
      "www.coverza.co.uk";

    return NextResponse.redirect(
      canonicalUrl,
      308
    );
  }

  /*
   * Private maintenance bypass.
   *
   * Open:
   * https://www.coverza.co.uk/?maintenance_bypass=YOUR_SECRET
   */
  const suppliedBypassSecret =
    req.nextUrl.searchParams
      .get(MAINTENANCE_BYPASS_PARAM)
      ?.trim();

  const configuredBypassSecret =
    process.env
      .MAINTENANCE_BYPASS_SECRET
      ?.trim();

  if (
    maintenanceEnabled() &&
    configuredBypassSecret &&
    suppliedBypassSecret ===
      configuredBypassSecret
  ) {
    const cleanUrl =
      req.nextUrl.clone();

    cleanUrl.searchParams.delete(
      MAINTENANCE_BYPASS_PARAM
    );

    const response =
      NextResponse.redirect(cleanUrl);

    response.cookies.set({
      name: MAINTENANCE_COOKIE_NAME,
      value: configuredBypassSecret,
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  }

  /*
   * Maintenance mode.
   */
  if (
    maintenanceEnabled() &&
    !isAlwaysAllowedPath(pathname) &&
    !hasValidBypassCookie(req)
  ) {
    const maintenanceUrl =
      req.nextUrl.clone();

    maintenanceUrl.pathname =
      "/maintenance.html";

    maintenanceUrl.search = "";

    return NextResponse.rewrite(
      maintenanceUrl
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};