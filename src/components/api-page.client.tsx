"use client";
import { defineClientConfig } from "@/openapi/ui/client";
import { CustomResultDisplay } from "./playground-request-info";

export default defineClientConfig({
  storageKeyPrefix: "cc-api-docs-",
  playground: {
    transformAuthInputs: (inputs) => {
      console.log(inputs);
      return inputs;
    },
    requestTimeout: 60,
    components: {
      ResultDisplay: CustomResultDisplay,
    },
  },
});
