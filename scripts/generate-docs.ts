import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { rimraf } from "rimraf";
import { i18n } from "@/lib/i18n";
import type { OutputFile } from "@/openapi/generate-file";
import * as OpenAPI from "@/openapi/generate-file";
import { createOpenAPI } from "@/openapi/server";

const out = "./content/docs/(api)";

type SchemaMap = Record<
  string,
  string | OpenAPIV3_1.Document | OpenAPIV3.Document
>;

async function generate() {
  // clean generated files
  await rimraf(out, {
    filter(v) {
      return !v.endsWith("meta.json");
    },
  });

  // Generate docs for each language using file naming (xxx.mdx, xxx.zh.mdx)
  for (const lang of i18n.languages) {
    const schemaId = `v1-${lang}`;

    // Create isolated openapi instance for current language, only containing current language's schema
    const langOpenAPI = createOpenAPI({
      async input(): Promise<SchemaMap> {
        // Only fetch OpenAPI document for current language
        const jsonDoc = await fetch(
          `https://api.crowdcomputed.cc/api/workflow/openapi/all?language=${lang}`,
        ).then((res) => res.json());

        return {
          [schemaId]: jsonDoc as OpenAPIV3_1.Document | OpenAPIV3.Document,
        };
      },
      disableCache: true, // Disable cache to ensure fresh data each time
    });

    await OpenAPI.generateFiles({
      input: langOpenAPI,
      output: out, // All language files are generated to the same directory
      beforeWrite(files: OutputFile[]) {
        // Remove api/v1-{lang}/ prefix if present
        files.forEach((file) => {
          if (file.path.startsWith(`api/${schemaId}/`)) {
            file.path = file.path.replace(new RegExp(`^api/${schemaId}/`), "");
          } else if (file.path.startsWith("api/v1/")) {
            file.path = file.path.replace(/^api\/v1\//, "");
          }

          // If not default language, add language suffix to filename
          // Example: post.mdx -> post.zh.mdx
          if (lang !== i18n.defaultLanguage) {
            // Match filename, e.g., generate/ai-image-editing/post.mdx
            file.path = file.path.replace(/(\/[^/]+)\.mdx$/, `$1.${lang}.mdx`);
          }
        });
      },
    });
  }
}

void generate();
