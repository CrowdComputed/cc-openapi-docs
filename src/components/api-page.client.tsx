"use client";
import { defineClientConfig } from "@/openapi/ui/client";
import { ResultDisplayExtended } from "./result-display-extended";

export default defineClientConfig({
  storageKeyPrefix: "cc-api-docs-",
  playground: {
    transformAuthInputs: (inputs) => {
      console.log(inputs);
      return inputs;
    },
    requestTimeout: 60 * 20,
    components: {
      ResultDisplayExtended: ResultDisplayExtended,
    },
  },
});
