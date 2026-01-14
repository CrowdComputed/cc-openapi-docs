import { useMemo } from "react";
import type { AuthField } from "@/openapi/playground/client";
import { useApiContext } from "../contexts/api";

type KeyName =
  | "server-url"
  | `auth-${string}`
  | `api-${string}`
  | "common-headers"
  | `panel-state-${string}`;

export function useStorageKey() {
  const { storageKeyPrefix } = useApiContext().client;

  return useMemo(
    () => ({
      of: (name: KeyName) => getStorageKey(storageKeyPrefix, name),
      AuthField: (field: AuthField) =>
        getStorageKey(
          storageKeyPrefix,
          `auth-${field.original?.id ?? field.fieldName}`,
        ),
      ApiForm: (route: string, method: string) =>
        getStorageKey(storageKeyPrefix, `api-${method.toUpperCase()}-${route}`),
      CommonHeaders: () => getStorageKey(storageKeyPrefix, "common-headers"),
      PanelState: (route: string, method: string) =>
        getStorageKey(
          storageKeyPrefix,
          `panel-state-${method.toUpperCase()}-${route}`,
        ),
    }),
    [storageKeyPrefix],
  );
}

export function getStorageKey(prefix = "fumadocs-openapi-", name: KeyName) {
  return prefix + name;
}
