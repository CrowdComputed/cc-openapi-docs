import client from "@/components/api-page.client";
import { openapi } from "@/lib/openapi";
import { createAPIPage } from "@/openapi/ui/api-page";

export const APIPage = createAPIPage(openapi, {
  client,
  playground: {
    enabled: true,
  },
});
