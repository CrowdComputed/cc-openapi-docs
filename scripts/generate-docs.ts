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

  // 为每种语言生成文档，使用文件命名方式（xxx.mdx, xxx.zh.mdx）
  for (const lang of i18n.languages) {
    const schemaId = `v1-${lang}`;

    // 为当前语言创建独立的 openapi 实例，只包含当前语言的 schema
    const langOpenAPI = createOpenAPI({
      async input(): Promise<SchemaMap> {
        // 只获取当前语言的 OpenAPI 文档
        const jsonDoc = await fetch(
          `https://api.crowdcomputed.cc/api/workflow/openapi/all?language=${lang}`,
        ).then((res) => res.json());

        return {
          [schemaId]: jsonDoc as OpenAPIV3_1.Document | OpenAPIV3.Document,
        };
      },
      disableCache: true, // 禁用缓存，确保每次都是最新的
    });

    await OpenAPI.generateFiles({
      input: langOpenAPI,
      output: out, // 所有语言的文件都生成到同一个目录
      beforeWrite(files: OutputFile[]) {
        // 移除 api/v1-{lang}/ 前缀（如果有的话）
        files.forEach((file) => {
          if (file.path.startsWith(`api/${schemaId}/`)) {
            file.path = file.path.replace(new RegExp(`^api/${schemaId}/`), "");
          } else if (file.path.startsWith("api/v1/")) {
            file.path = file.path.replace(/^api\/v1\//, "");
          }

          // 如果不是默认语言，在文件名后添加语言后缀
          // 例如：post.mdx -> post.zh.mdx
          if (lang !== i18n.defaultLanguage) {
            // 匹配文件名，例如：generate/ai-image-editing/post.mdx
            file.path = file.path.replace(/(\/[^/]+)\.mdx$/, `$1.${lang}.mdx`);
          }
        });
      },
    });
  }
}

void generate();
