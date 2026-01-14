import type { CodeUsageGenerator } from "@/openapi/ui/operation/usage-tabs";
import * as CSharp from "./csharp";
import * as CURL from "./curl";
import * as Go from "./go";
import * as Java from "./java";
import * as JS from "./javascript";
import * as Python from "./python";

export const defaultSamples: CodeUsageGenerator[] = [
  {
    id: "curl",
    label: "cURL",
    source: CURL.generator,
    lang: "bash",
  },
  {
    id: "js",
    label: "JavaScript",
    source: JS.generator,
    lang: "js",
  },
  {
    id: "go",
    label: "Go",
    source: Go.generator,
    lang: "go",
  },
  {
    id: "python",
    label: "Python",
    source: Python.generator,
    lang: "python",
  },
  {
    id: "java",
    label: "Java",
    source: Java.generator,
    lang: "java",
  },
  {
    id: "csharp",
    label: "C#",
    source: CSharp.generator,
    lang: "csharp",
  },
];
