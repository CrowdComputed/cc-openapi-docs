import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared";
import { createSource } from "@/lib/source";

export const dynamic = "force-dynamic";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Create fresh source with latest OpenAPI data on each request
  const source = await createSource();
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
