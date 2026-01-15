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
      enabled: false, // 禁用搜索功能，避免翻译文件结构不匹配的问题
    },
  };
}
