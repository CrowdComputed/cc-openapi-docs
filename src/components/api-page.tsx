import { createAPIPage } from "fumadocs-openapi/ui";
import client from "@/components/api-page.client";
import { openapi } from "@/lib/openapi";

export const APIPage = createAPIPage(openapi, {
  client,
  playground: {
    enabled: true,
  },
  content: {
    renderOperationLayout: async (slots) => {
      // 在 body 后面添加我们的自定义组件
      // 使用 DOM 注入器来确保组件在 playground 的 FormProvider 内部渲染
      return (
        <div className="flex flex-col gap-x-6 gap-y-4 @4xl:flex-row @4xl:items-start">
          <div className="min-w-0 flex-1">
            {slots.header}
            {slots.apiPlayground}
            {slots.description}
            {slots.authSchemes}
            {slots.paremeters}
            {slots.body}
            {slots.responses}
            {slots.callbacks}
          </div>
          <div className="@4xl:sticky @4xl:top-[calc(var(--fd-docs-row-1,2rem)+1rem)] @4xl:w-[400px]">
            {slots.apiExample}
          </div>
        </div>
      );
    },
  },
});
