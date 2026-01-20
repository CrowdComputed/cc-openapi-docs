import { createI18nMiddleware } from "fumadocs-core/i18n/middleware";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { i18n } from "./src/lib/i18n";

const i18nMiddleware = createI18nMiddleware(i18n);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  let response = await i18nMiddleware(request, event);

  if (!response) {
    response = NextResponse.next();
  }

  const cspValue =
    "default-src 'self' http: https: ws: wss: data: blob: 'unsafe-inline'; frame-ancestors *;";

  response.headers.delete("Content-Security-Policy");
  response.headers.set("Content-Security-Policy", cspValue);

  return response;
}
