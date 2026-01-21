"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Global component to sync URL changes to parent container (if in iframe)
 */
export function UrlSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if we're in an iframe
    const isInIframe = window.parent !== window;
    if (!isInIframe) return;

    // Get current full URL
    const currentUrl = window.location.href;

    // Send URL to parent window
    try {
      window.parent.postMessage(
        {
          type: "OPENAPI_URL_CHANGED",
          source: "fumadocs-openapi-playground",
          url: currentUrl,
          pathname: pathname,
          searchParams: searchParams.toString(),
        },
        "*", // In production, you might want to specify the parent origin
      );
    } catch (error) {
      console.error("Failed to send URL to parent window:", error);
    }
  }, [pathname, searchParams]);

  return null;
}
