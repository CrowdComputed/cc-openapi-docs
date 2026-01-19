import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { openapi } from "@/lib/openapi";
import { getPageImage, source } from "@/lib/source";
import { createAPIPage } from "@/openapi/ui/api-page";

export default async function Page(props: PageProps<"/[locale]/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug, params.locale);
  if (!page) notFound();

  // Check if this is an OpenAPI page
  if (
    "getAPIPageProps" in page.data &&
    typeof page.data.getAPIPageProps === "function"
  ) {
    const APIPage = createAPIPage(openapi);
    const apiProps = page.data.getAPIPageProps();
    const schema = page.data.getSchema();

    return (
      <DocsPage
        toc={page.data.toc}
        tableOfContent={{
          style: "clerk",
        }}
        full
      >
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription className="mb-0">
          {page.data.description}
        </DocsDescription>
        <DocsBody>
          <APIPage {...apiProps} document={schema.id} />
        </DocsBody>
      </DocsPage>
    );
  }

  return null;
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/[locale]/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug, params.locale);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
