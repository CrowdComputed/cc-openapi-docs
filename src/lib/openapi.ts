import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { createOpenAPI } from "@/openapi/server";
import { i18n } from "./i18n";

type SchemaMap = Record<
  string,
  string | OpenAPIV3_1.Document | OpenAPIV3.Document
>;

export const openapi = createOpenAPI({
  disableCache: false, // Enable caching with 60s revalidation
  async input(): Promise<SchemaMap> {
    // Get all supported languages
    const languages = i18n.languages;

    // Fetch OpenAPI documents for all languages in parallel
    const schemas = await Promise.all(
      languages.map(async (lang) => {
        const jsonDoc = await fetch(
          `https://api.crowdcomputed.cc/api/workflow/openapi/all?language=${lang}`,
          {
            next: { revalidate: 60 }, // Cache for 60 seconds
          },
        ).then((res) => res.json());

        return { lang, doc: jsonDoc };
      }),
    );

    // Return schema map with language as key
    const result: Record<
      string,
      string | OpenAPIV3_1.Document | OpenAPIV3.Document
    > = {};
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
