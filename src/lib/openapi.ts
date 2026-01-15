import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { createOpenAPI } from "@/openapi/server";
import { i18n } from "./i18n";

type SchemaMap = Record<
  string,
  string | OpenAPIV3_1.Document | OpenAPIV3.Document
>;

export const openapi = createOpenAPI({
  async input(): Promise<SchemaMap> {
    // 获取所有支持的语言
    const languages = i18n.languages;

    // 并行获取所有语言的 OpenAPI 文档
    const schemas = await Promise.all(
      languages.map(async (lang) => {
        const jsonDoc = await fetch(
          `https://api.crowdcomputed.cc/api/workflow/openapi/all?language=${lang}`,
        ).then((res) => res.json());

        return { lang, doc: jsonDoc };
      }),
    );

    // 返回以语言为 key 的 schema map
    const result: Record<
      string,
      string | OpenAPIV3_1.Document | OpenAPIV3.Document
    > = {};
    for (const { lang, doc } of schemas) {
      result[`v1-${lang}`] = doc as OpenAPIV3_1.Document | OpenAPIV3.Document;
    }

    // 为了向后兼容，也保留默认的 v1（使用默认语言）
    const defaultDoc = schemas.find(
      (s) => s.lang === i18n.defaultLanguage,
    )?.doc;
    if (defaultDoc) {
      result.v1 = defaultDoc as OpenAPIV3_1.Document | OpenAPIV3.Document;
    }

    return result;
  },
});
