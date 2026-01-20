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
    // Get existing CSP to preserve other directives
    const existingCSP =
      response.headers.get("content-security-policy") ||
      response.headers.get("Content-Security-Policy") ||
      "";

    // Remove all CSP headers first
    response.headers.delete("content-security-policy");
    response.headers.delete("Content-Security-Policy");

    // Parse existing CSP and replace frame-ancestors directive
    let newCSP = "";
    if (existingCSP) {
      // Remove frame-ancestors directive and add our own
      const directives = existingCSP
        .split(";")
        .map((d) => d.trim())
        .filter((d) => d && !d.toLowerCase().startsWith("frame-ancestors"));

      newCSP =
        directives.length > 0
          ? `${directives.join("; ")}; frame-ancestors *;`
          : "frame-ancestors *;";
    } else {
      newCSP = "frame-ancestors *;";
    }

    // Set the merged CSP header
    response.headers.set("Content-Security-Policy", newCSP);

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
