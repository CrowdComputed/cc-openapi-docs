import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShareLinkButton } from "@/components/share-link-button";
import { openapi } from "@/lib/openapi";
import { getPageImage, source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";
import { createAPIPage } from "@/openapi/ui/api-page";

// Revalidate every 60 seconds to keep OpenAPI data fresh
export const revalidate = 60;

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
        <div className="flex items-center gap-3 mb-4">
          <DocsTitle className="mb-0 flex-1">{page.data.title}</DocsTitle>
          <ShareLinkButton
            locale={params.locale}
            slug={params.slug?.join("/")}
          />
        </div>
        <DocsDescription className="mb-0">
          {page.data.description}
        </DocsDescription>
        <DocsBody>
          <APIPage {...apiProps} document={schema.id} showDescription={false} />
        </DocsBody>
      </DocsPage>
    );
  }

  // Regular MDX page
  // Check if page has body property (MDX pages have body, OpenAPI pages don't)
  if ("body" in page.data) {
    const MDX = page.data.body;
    const full: boolean =
      "full" in page.data && typeof page.data.full === "boolean"
        ? page.data.full
        : false;

    if (!MDX) {
      return (
        <DocsPage
          toc={page.data.toc}
          tableOfContent={{
            style: "clerk",
          }}
          full={full}
        >
          <div className="flex items-center gap-3 mb-4">
            <DocsTitle className="mb-0 flex-1">{page.data.title}</DocsTitle>
            <ShareLinkButton locale={params.locale} />
          </div>
          <DocsDescription className="mb-0">
            {page.data.description}
          </DocsDescription>
          <DocsBody>
            <p>No content available.</p>
          </DocsBody>
        </DocsPage>
      );
    }

    return (
      <DocsPage
        toc={page.data.toc}
        tableOfContent={{
          style: "clerk",
        }}
        full={full}
      >
        <div className="flex items-center gap-3 mb-4">
          <DocsTitle className="mb-0 flex-1">{page.data.title}</DocsTitle>
          <ShareLinkButton locale={params.locale} />
        </div>
        <DocsDescription className="mb-0">
          {page.data.description}
        </DocsDescription>
        <DocsBody>
          <MDX
            components={getMDXComponents({
              // this allows you to link to other pages with relative file paths
              a: createRelativeLink(source, page),
            })}
          />
        </DocsBody>
      </DocsPage>
    );
  }

  // Fallback for pages without body
  const full: boolean =
    "full" in page.data && typeof page.data.full === "boolean"
      ? page.data.full
      : false;
  return (
    <DocsPage
      toc={page.data.toc}
      tableOfContent={{
        style: "clerk",
      }}
      full={full}
    >
      <div className="flex items-center gap-3 mb-4">
        <DocsTitle className="mb-0 flex-1">{page.data.title}</DocsTitle>
        <ShareLinkButton locale={params.locale} />
      </div>
      <DocsDescription className="mb-0">
        {page.data.description}
      </DocsDescription>
      <DocsBody>
        <p>No content available.</p>
      </DocsBody>
    </DocsPage>
  );
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
