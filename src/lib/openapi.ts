import { createOpenAPI } from "fumadocs-openapi/server";

export const openapi = createOpenAPI({
  async input() {
    const jsonDoc = await fetch(
      "https://api.crowdcomputed.cc/api/workflow/openapi/all?language=zh",
    ).then((res) => res.json());

    return {
      v1: jsonDoc,
    };
  },
});
