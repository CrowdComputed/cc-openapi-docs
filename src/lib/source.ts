import { docs } from "fumadocs-mdx:collections/server";
import { type InferPageType, loader, multiple } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { createOpenAPI, openapiPlugin, openapiSource } from "@/openapi/server";
import { i18n } from "./i18n";
import { openapi } from "./openapi";

type SchemaMap = Record<
  string,
  string | OpenAPIV3_1.Document | OpenAPIV3.Document
>;

// Create a function that dynamically creates source with fresh OpenAPI data
export async function createSource() {
  // Create a new openapi instance with disabled cache to ensure fresh data on each call
  const freshOpenapi = createOpenAPI({
    disableCache: true, // Disable cache to always fetch fresh data
    async input(): Promise<SchemaMap> {
      // Get all supported languages
      const languages = i18n.languages;

      // Fetch OpenAPI documents for all languages in parallel
      const schemas = await Promise.all(
        languages.map(async (lang) => {
          const jsonDoc = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/workflow/openapi/all?language=${lang}`,
            {
              next: { revalidate: 60 }, // Cache for 60 seconds at fetch level
            },
          ).then((res) => res.json());

          return { lang, doc: jsonDoc };
        }),
      );

      // Return schema map with language as key
      const result: SchemaMap = {};
      for (const { lang, doc } of schemas) {
        result[`v1-${lang}`] = doc as OpenAPIV3_1.Document | OpenAPIV3.Document;
      }

      // For backward compatibility, also keep default v1 (using default language)
      const defaultDoc = schemas.find(
        (s) => s.lang === i18n.defaultLanguage,
      )?.doc;
      if (defaultDoc) {
        result.v1 = defaultDoc as OpenAPIV3_1.Document | OpenAPIV3.Document;
      }

      return result;
    },
  });

  return loader(
    multiple({
      docs: docs.toFumadocsSource(),
      // Only use dynamic OpenAPI source, exclude static MDX files from (api) directory
      // This will fetch fresh OpenAPI data on each call
      openapi: await openapiSource(freshOpenapi, {
        baseDir: "(api)",
        per: "operation",
        groupBy: "none",
      }),
    }),
    {
      baseUrl: "/",
      i18n,
      plugins: [lucideIconsPlugin(), openapiPlugin()],
    },
  );
}

// Legacy export for backward compatibility (cached, use createSource() for fresh data)
export const source = loader(
  multiple({
    docs: docs.toFumadocsSource(),
    // Only use dynamic OpenAPI source, exclude static MDX files from (api) directory
    openapi: await openapiSource(openapi, {
      baseDir: "(api)",
      per: "operation",
      groupBy: "none",
    }),
  }),
  {
    baseUrl: "/",
    i18n,
    plugins: [lucideIconsPlugin(), openapiPlugin()],
  },
);

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url: `/og/docs/${segments.join("/")}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  // OpenAPI pages don't have getText method
  if ("getText" in page.data && typeof page.data.getText === "function") {
    const processed = await page.data.getText("processed");
    return `# ${page.data.title}

${processed}`;
  }

  // For OpenAPI pages, return title and description only
  return `# ${page.data.title}

${page.data.description || ""}`;
}
