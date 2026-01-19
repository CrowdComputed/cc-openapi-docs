import type { Document, OperationObject } from "@/openapi/types";
import type { ApiPageProps } from "@/openapi/ui/api-page";
import type { OutputEntry } from "@/openapi/utils/pages/builder";

export function toBody(
  entry: OutputEntry,
  dereferenced?: Document,
): ApiPageProps {
  if (entry.type === "operation")
    return {
      document: entry.schemaId,
      operations: [entry.item],
    };
  if (entry.type === "webhook")
    return {
      document: entry.schemaId,
      webhooks: [entry.item],
    };

  // Sort operations by index if dereferenced document is provided
  let sortedOperations = entry.operations;
  let sortedWebhooks = entry.webhooks;

  if (dereferenced) {
    if (sortedOperations) {
      sortedOperations = [...sortedOperations].sort((a, b) => {
        const pathItemA = dereferenced.paths?.[a.path];
        const pathItemB = dereferenced.paths?.[b.path];
        const operationA = pathItemA?.[a.method];
        const operationB = pathItemB?.[b.method];
        const indexA =
          (operationA as OperationObject & { index?: number })?.index ??
          Infinity;
        const indexB =
          (operationB as OperationObject & { index?: number })?.index ??
          Infinity;
        return indexA - indexB;
      });
    }

    if (sortedWebhooks) {
      sortedWebhooks = [...sortedWebhooks].sort((a, b) => {
        const pathItemA = dereferenced.webhooks?.[a.name];
        const pathItemB = dereferenced.webhooks?.[b.name];
        // @ts-expect-error
        const operationA = pathItemA?.[a.method];
        // @ts-expect-error
        const operationB = pathItemB?.[b.method];
        const indexA =
          (operationA as OperationObject & { index?: number })?.index ??
          Infinity;
        const indexB =
          (operationB as OperationObject & { index?: number })?.index ??
          Infinity;
        return indexA - indexB;
      });
    }
  }

  return {
    showTitle: true,
    showDescription: true,
    document: entry.schemaId,
    operations: sortedOperations,
    webhooks: sortedWebhooks,
  };
}
