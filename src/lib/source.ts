import { docs } from "fumadocs-mdx:collections/server";
import { type InferPageType, loader, multiple } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { openapiPlugin, openapiSource } from "@/openapi/server";
import { i18n } from "./i18n";
import { openapi } from "./openapi";

// See https://fumadocs.dev/docs/headless/source-api for more info
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
