import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { i18n } from "@/lib/i18n";

export function baseOptions(locale: string): BaseLayoutProps {
  return {
    i18n,
    nav: {
      title: "CrowdComputed API",
      url: `/${locale}`,
    },
    searchToggle: {
      enabled: false, // Disable search to avoid translation file structure mismatch
    },
  };
}
