import client from "@/components/api-page.client";
import { openapi } from "@/lib/openapi";
import { createAPIPage } from "@/openapi/ui/api-page";

export const APIPage = createAPIPage(openapi, {
  client,
  playground: {
    enabled: true,
  },
  content: {
    renderOperationLayout: async (slots) => {
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
