import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import { defineI18nUI } from "fumadocs-ui/i18n";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { UrlSync } from "@/components/url-sync";
import { i18n } from "@/lib/i18n";

const inter = Inter({
  subsets: ["latin"],
});

const { provider } = defineI18nUI(i18n, {
  translations: {
    en: {},
    zh: {},
  },
});

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <html lang={locale} className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider
          i18n={provider(locale)}
          theme={{
            enabled: false,
          }}
        >
          <UrlSync />
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
