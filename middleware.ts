import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, hostname, search } = req.nextUrl;

  // 🚫 NEVER redirect Stripe webhooks
  if (pathname.startsWith("/api/stripe/webhook")) {
    return NextResponse.next();
  }

  // 🚫 Skip all other API routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // ✅ Force canonical www domain
  if (hostname === "coverza.co.uk") {
    const url = req.nextUrl.clone();
    url.hostname = "www.coverza.co.uk";
    url.search = search;

    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

// Apply to everything EXCEPT static assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
