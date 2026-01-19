import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tree = source.getPageTree(locale);
  console.log("tree", tree);
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
