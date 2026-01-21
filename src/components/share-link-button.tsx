"use client";

import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { Check, Link2 } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ShareLinkButtonProps {
  locale: string;
  slug?: string;
}

export function ShareLinkButton({ locale, slug }: ShareLinkButtonProps) {
  const [checked, onClick] = useCopyButton(() => {
    if (slug) {
      return navigator.clipboard.writeText(
        `${process.env.NEXT_PUBLIC_WEB_URL}/generate/${slug}/doc/`,
      );
    }
    return navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_WEB_URL}/docs/api/`,
    );
  });

  return (
    <button
      onClick={onClick}
      className={cn(
        buttonVariants({
          color: "secondary",
          size: "sm",
          className: "gap-2 [&_svg]:size-4",
        }),
      )}
      title={locale === "zh" ? "复制页面链接" : "Copy page link"}
      aria-label={locale === "zh" ? "复制页面链接" : "Copy page link"}
      type="button"
    >
      {checked ? <Check className="size-4" /> : <Link2 className="size-4" />}
      <span className="hidden sm:inline">
        {locale === "zh" ? "分享链接" : "Share link"}
      </span>
    </button>
  );
}
