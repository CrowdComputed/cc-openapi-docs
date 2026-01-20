import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

// Revalidate every 60 seconds to keep sidebar navigation fresh
export const revalidate = 60;

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tree = source.getPageTree(locale);
  return (
    <DocsLayout
      tree={tree}
      {...baseOptions(locale)}
      sidebar={{
        collapsible: false, // Disable sidebar collapse
      }}
    >
      {children}
    </DocsLayout>
  );
}
