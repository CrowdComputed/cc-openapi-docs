import { createI18nMiddleware } from "fumadocs-core/i18n/middleware";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { i18n } from "./src/lib/i18n";

const i18nMiddleware = createI18nMiddleware(i18n);

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  // First apply i18n middleware
  const response = i18nMiddleware(request, event);

  // Override CSP header to allow iframe embedding from any origin
  if (response instanceof NextResponse) {
    response.headers.set("Content-Security-Policy", "frame-ancestors *;");

    // Remove X-Frame-Options if present (CSP takes precedence)
    response.headers.delete("X-Frame-Options");
  }

  return response;
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  // You may need to adjust it to ignore static assets in `/public` folder
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
