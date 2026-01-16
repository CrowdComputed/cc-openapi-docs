import { createTokenizer } from "@orama/tokenizers/mandarin";
import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

export const { GET } = createFromSource(source, {
  // Configure locales with tokenizers
  // English uses default tokenizer, Chinese uses Mandarin tokenizer
  localeMap: {
    en: {
      language: "english",
    },
    zh: {
      components: {
        tokenizer: createTokenizer(),
      },
      search: {
        threshold: 0,
        tolerance: 0,
      },
    },
  },
});
