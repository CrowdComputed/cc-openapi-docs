"use client";
import { defineClientConfig } from "fumadocs-openapi/ui/client";
import { CustomResultDisplay } from "./playground-request-info";

export default defineClientConfig({
  storageKeyPrefix: "cc-api-docs-",
  playground: {
    transformAuthInputs: (inputs) => inputs,
    requestTimeout: 60,
    components: {
      ResultDisplay: CustomResultDisplay,
    },
  },
});
