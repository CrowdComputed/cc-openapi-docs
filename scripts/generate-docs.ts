import { rimraf } from "rimraf";
import { openapi } from "@/lib/openapi";
import type { OutputFile } from "@/openapi/generate-file";
import * as OpenAPI from "@/openapi/generate-file";

const out = "./content/docs/(api)";

async function generate() {
  // clean generated files
  await rimraf(out, {
    filter(v) {
      return !v.endsWith("meta.json");
    },
  });

  await OpenAPI.generateFiles({
    input: openapi,
    output: out,
    beforeWrite(files: OutputFile[]) {
      // 优化路径层级：移除 api/v1 前缀
      // 例如：api/v1/generate/xxx/post.mdx -> generate/xxx/post.mdx
      files.forEach((file) => {
        // 移除 api/v1/ 前缀（路径是相对于 output 的相对路径）
        if (file.path.startsWith("api/v1/")) {
          file.path = file.path.replace(/^api\/v1\//, "");
        }
      });
    },
  });
}

void generate();
