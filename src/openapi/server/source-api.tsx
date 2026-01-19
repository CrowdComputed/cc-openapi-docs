import type { StructuredData } from "fumadocs-core/mdx-plugins";
import type {
  LoaderPlugin,
  PageData,
  PageTreeTransformer,
  Source,
  VirtualFile,
} from "fumadocs-core/source";
import type { TOCItemType } from "fumadocs-core/toc";
import { i18n } from "@/lib/i18n";
import type { OpenAPIServer } from "@/openapi/server/create";
import type { ApiPageProps } from "@/openapi/ui/api-page";
import { MethodLabel } from "@/openapi/ui/components/method-label";
import type { SchemaToPagesOptions } from "@/openapi/utils/pages/preset-auto";
import type { ProcessedDocument } from "@/openapi/utils/process-document";

declare module "fumadocs-core/source" {
  export interface PageData {
    /**
     * Added by Fumadocs OpenAPI
     */
    _openapi?: InternalOpenAPIMeta;
  }
}

export interface InternalOpenAPIMeta {
  method?: string;
  webhook?: boolean;
  index?: number;
}

/**
 * Fumadocs Source API integration, pass this to `plugins` array in `loader()`.
 */
export function openapiPlugin(): LoaderPlugin {
  return {
    name: "fumadocs:openapi",
    enforce: "pre",
    transformPageTree: {
      file(node, filePath) {
        if (!filePath) return node;
        const file = this.storage.read(filePath);
        if (!file || file.format !== "page") return node;

        const openApiData = file.data._openapi;
        if (!openApiData || typeof openApiData !== "object") return node;

        if (openApiData.webhook) {
          node.name = (
            <>
              {node.name}{" "}
              <span className="ms-auto border border-current px-1 rounded-lg text-xs text-nowrap font-mono">
                Webhook
              </span>
            </>
          );
        } else if (openApiData.method) {
          node.name = (
            <>
              {node.name}{" "}
              <MethodLabel className="ms-auto text-xs text-nowrap">
                {openApiData.method}
              </MethodLabel>
            </>
          );
        }

        return node;
      },
      folder(node, folderPath) {
        // Only sort (api) folder children by index from OpenAPI pages
        // Check if this is the (api) folder by checking folderPath or node name
        const isApiFolder =
          folderPath === "(api)" ||
          folderPath?.includes("(api)") ||
          (typeof node.name === "string" && node.name === "(api)");

        if (!isApiFolder) {
          return node;
        }

        if (node.children && node.children.length > 0) {
          const sortedChildren = [...node.children].sort((a, b) => {
            // Get index from page data if available
            const getIndex = (child: typeof a): number => {
              if (child.type === "page") {
                try {
                  // Try to read the file using the url or file path
                  const urlPath = child.url
                    ?.replace(/^\//, "")
                    .replace(/\/$/, "");
                  if (urlPath) {
                    // Try different possible file paths
                    const possiblePaths = [
                      `(api)/${urlPath.split("/").pop()}.mdx`,
                      `${urlPath}.mdx`,
                      urlPath,
                    ];

                    for (const path of possiblePaths) {
                      try {
                        const file = this.storage.read(path);
                        if (file?.format === "page") {
                          const pageData = file.data as PageData;
                          if (pageData && "_openapi" in pageData) {
                            const openApiData = (
                              pageData as { _openapi?: InternalOpenAPIMeta }
                            )._openapi;
                            if (openApiData?.index !== undefined) {
                              return openApiData.index;
                            }
                          }
                        }
                      } catch {
                        // Continue to next path
                      }
                    }
                  }
                } catch {
                  // Ignore errors
                }
              }
              return Infinity;
            };
            return getIndex(a) - getIndex(b);
          });
          return { ...node, children: sortedChildren };
        }
        return node;
      },
    },
  };
}

interface OpenAPIPageData extends PageData {
  getAPIPageProps: () => ApiPageProps;
  getSchema: () => { id: string } & ProcessedDocument;
  structuredData: StructuredData;
  toc: TOCItemType[];
}

/**
 * Generate virtual pages for Fumadocs Source API
 */
export async function openapiSource(
  server: OpenAPIServer,
  options: SchemaToPagesOptions & {
    baseDir?: string;
  } = {},
): Promise<
  Source<{
    metaData: never;
    pageData: OpenAPIPageData;
  }>
> {
  const { baseDir = "" } = options;
  const { createAutoPreset } = await import(
    "@/openapi/utils/pages/preset-auto"
  );
  const { fromServer } = await import("@/openapi/utils/pages/builder");
  const { toBody } = await import("@/openapi/utils/pages/to-body");
  const { toStaticData } = await import("@/openapi/utils/pages/to-static-data");
  const files: VirtualFile<{
    pageData: OpenAPIPageData;
    metaData: never;
  }>[] = [];

  const entries = await fromServer(server, createAutoPreset(options));
  for (const [schemaId, list] of Object.entries(entries)) {
    const processed = await server.getSchema(schemaId);

    // Extract language from schemaId (e.g., "v1-en" -> "en", "v1-zh" -> "zh")
    const langMatch = schemaId.match(/^v1-(.+)$/);
    const lang = langMatch ? langMatch[1] : undefined;

    for (const entry of list) {
      const props = toBody(entry);
      props.showDescription ??= true;

      // Apply path transformation rules from generate-docs.ts
      let filePath = entry.path;

      // Remove api/v1-{lang}/ prefix if present
      if (filePath.startsWith(`api/${schemaId}/`)) {
        filePath = filePath.replace(new RegExp(`^api/${schemaId}/`), "");
      } else if (filePath.startsWith("api/v1/generate/")) {
        filePath = filePath.replace(/^api\/v1\/generate\//, "");
      }

      // Remove .mdx extension if present (entry.path already includes it)
      if (filePath.endsWith(".mdx")) {
        filePath = filePath.slice(0, -4);
      }

      // Remove any "generate/" prefix that might create unwanted folders
      // This ensures all paths are flattened to a single level
      if (filePath.startsWith("generate/")) {
        filePath = filePath.replace(/^generate\//, "");
      }

      // Convert path from "interface-name/method" to "interface-name"
      // This flattens the sidebar structure to a single level
      // Example: ai-image-editing/post -> ai-image-editing
      const pathMatch = filePath.match(/^([^/]+)\/([^/]+)$/);
      if (pathMatch) {
        const [, interfaceName] = pathMatch;
        // Since each interface has only one method, use interface name as filename
        filePath = interfaceName;
      }

      // Add .mdx extension back
      filePath = `${filePath}.mdx`;

      // If not default language, add language suffix to filename
      // Example: ai-image-editing.mdx -> ai-image-editing.zh.mdx
      if (lang && lang !== i18n.defaultLanguage) {
        filePath = filePath.replace(/(\.mdx)$/, `.${lang}$1`);
      }

      // Get index from entry for sorting
      const index = entry.index;

      files.push({
        type: "page",
        path: `${baseDir}/${filePath}`,
        data: {
          ...entry.info,
          getAPIPageProps() {
            return props;
          },
          getSchema() {
            return {
              id: schemaId,
              ...processed,
            };
          },
          ...toStaticData(props, processed.dereferenced),
          _openapi: {
            method:
              entry.type === "operation" || entry.type === "webhook"
                ? entry.item.method
                : undefined,
            webhook: entry.type === "webhook",
            index, // Store index for sorting in page tree
          },
        },
      });
    }
  }

  return {
    files,
  };
}

/**
 * @deprecated use `openapiPlugin()`
 */
export function transformerOpenAPI(): PageTreeTransformer {
  const plugin = openapiPlugin();
  if (!plugin.transformPageTree) {
    throw new Error("transformPageTree is not available");
  }
  return plugin.transformPageTree;
}
