"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { FormValues } from "@/openapi/playground/client";
import type { FetchResult } from "@/openapi/playground/fetcher";
import { useStorageKey } from "@/openapi/ui/client/storage-key";
import { useApiContext } from "@/openapi/ui/contexts/api";
import { resolveServerUrl, withBase } from "@/openapi/utils/url";
import { OutputCard } from "./output-card";
import { PreviewDialog } from "./preview-dialog";
import type { Data, Root } from "./types";
import { useWebSocket } from "./use-websocket";

/**
 * Extended result display component
 */
export function ResultDisplayExtended({
  data,
  route,
  method,
}: {
  data: FetchResult<unknown>;
  route?: string;
  method?: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [currentData, setCurrentData] = useState<Root | null>(null);
  const [remainingTime, setRemainingTime] = useState<Record<string, number>>(
    {},
  );
  const wsMessagesRef = useRef<Array<Data & { timestamp: number }>>([]);
  const wsMessagesContainerRef = useRef<HTMLDivElement | null>(null);
  const wsMessagesCountRef = useRef<HTMLHeadingElement | null>(null);
  const wsStatusRef = useRef<HTMLDivElement | null>(null);

  // Get OpenAPI context information
  const { serverRef } = useApiContext();
  const form = useFormContext<FormValues>();
  const storageKeys = useStorageKey();

  // Initialize data
  useEffect(() => {
    if (data.status === 200) {
      const rootData = data.data as Root;
      if (
        rootData &&
        typeof rootData === "object" &&
        "code" in rootData &&
        rootData.code !== "Failed"
      ) {
        setCurrentData(rootData);
      }
    }
  }, [data]);

  // Get API base URL and headers
  const getApiConfig = () => {
    const targetServer = serverRef.current;
    const baseUrl = targetServer
      ? withBase(
          resolveServerUrl(targetServer.url, targetServer.variables),
          typeof window !== "undefined" ? window.location.origin : "",
        )
      : typeof window !== "undefined"
        ? window.location.origin
        : "";

    const formValues = form.getValues();
    const headers: Record<string, string> = {};

    // Prefer headers from _encoded (encoded format)
    if (formValues._encoded?.header) {
      const encodedHeaders = formValues._encoded.header;
      for (const [key, param] of Object.entries(encodedHeaders)) {
        if (param && typeof param === "object" && "value" in param) {
          headers[key] = String(param.value);
        }
      }
    } else if (formValues.header) {
      // If no _encoded, get from form values
      const headerObj = formValues.header as Record<string, unknown>;
      for (const [key, value] of Object.entries(headerObj)) {
        if (value && typeof value === "object" && "value" in value) {
          headers[key] = String((value as { value: unknown }).value);
        } else if (typeof value === "string") {
          headers[key] = value;
        }
      }
    }

    return { baseUrl, headers };
  };

  // Function to save response to localStorage
  const saveResponseToStorage = useCallback(
    (responseData: FetchResult) => {
      if (typeof window === "undefined" || responseData.status !== 200) {
        return;
      }

      // If no route and method, try to get from form's _encoded
      const finalRoute = route;
      const finalMethod =
        method ??
        (() => {
          try {
            const formValues = form.getValues();
            return formValues._encoded?.method as string | undefined;
          } catch {
            return undefined;
          }
        })();

      // If still no route and method, cannot save
      if (!finalRoute || !finalMethod) {
        return;
      }

      try {
        const responseKey = storageKeys.Response(finalRoute, finalMethod);
        localStorage.setItem(responseKey, JSON.stringify(responseData));
      } catch (error) {
        console.error("Failed to save response to localStorage:", error);
      }
    },
    [route, method, storageKeys, form],
  );

  // WebSocket connection
  useWebSocket({
    websocketUrl: currentData?.data.websocket,
    enabled: ["generating", "waiting"].includes(currentData?.data.status ?? ""),
    taskId: currentData?.data.taskId,
    getApiConfig,
    onMessage: (message) => {
      console.log("message", message);
      setCurrentData((prev) => {
        const updated = prev
          ? {
              ...prev,
              data: {
                ...prev.data,
                status: message.status,
                outputs: message.outputs,
              },
            }
          : null;
        console.log("updated", updated);

        const responseData: FetchResult = {
          ...data,
          data: updated,
        };
        saveResponseToStorage(responseData);

        return updated;
      });
    },
    messagesContainerRef: wsMessagesContainerRef,
    messagesCountRef: wsMessagesCountRef,
    messagesRef: wsMessagesRef,
    statusRef: wsStatusRef,
  });

  // When currentData updates, also update localStorage (for initial data and other updates)
  useEffect(() => {
    if (currentData && data.status === 200) {
      const responseData: FetchResult = {
        ...data,
        data: currentData,
      };
      saveResponseToStorage(responseData);
    }
  }, [currentData, data, saveResponseToStorage]);

  // Countdown logic
  useEffect(() => {
    if (!currentData) {
      return;
    }

    const updateRemainingTime = () => {
      const times: Record<string, number> = {};
      currentData.data.outputs?.forEach((output) => {
        if (
          output.status === "generating" &&
          output.startTime > 0 &&
          output.estimateMs > 0
        ) {
          const elapsed = Date.now() - output.startTime;
          const remaining = Math.max(0, output.estimateMs - elapsed);
          times[output.outputId] = remaining;
        }
      });
      setRemainingTime(times);
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [currentData]);

  // Get all media URLs (for preview)
  const allMediaUrls: string[] = currentData
    ? (currentData.data.outputs
        ?.flatMap((output) => output.urls ?? [])
        .filter((url): url is string => Boolean(url && url.length > 0)) ?? [])
    : [];

  // Keyboard event listener: support left/right arrow keys to switch media
  useEffect(() => {
    if (!previewOpen || allMediaUrls.length <= 1) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPreviewIndex((prev) =>
          prev === 0 ? allMediaUrls.length - 1 : prev - 1,
        );
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPreviewIndex((prev) =>
          prev === allMediaUrls.length - 1 ? 0 : prev + 1,
        );
      } else if (e.key === "Escape") {
        e.preventDefault();
        setPreviewOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewOpen, allMediaUrls.length]);

  if (data.status !== 200 || !currentData) {
    return null;
  }

  const outputs = currentData.data.outputs ?? [];
  if (outputs.length === 0) {
    return null;
  }

  const goToPreviewPrevious = () => {
    setPreviewIndex((prev) =>
      prev === 0 ? allMediaUrls.length - 1 : prev - 1,
    );
  };

  const goToPreviewNext = () => {
    setPreviewIndex((prev) =>
      prev === allMediaUrls.length - 1 ? 0 : prev + 1,
    );
  };

  const openPreview = (urlIndex: number) => {
    setPreviewIndex(urlIndex);
    setPreviewOpen(true);
  };

  // Calculate URL start index for each output
  const getUrlStartIndex = (index: number): number => {
    let urlStartIndex = 0;
    for (let i = 0; i < index; i++) {
      urlStartIndex += outputs[i]?.urls?.length ?? 0;
    }
    return urlStartIndex;
  };

  console.log(allMediaUrls);

  const hasMediaToPreview = allMediaUrls.length > 0;

  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {outputs.map((output, index) => (
          <OutputCard
            key={output.outputId}
            output={output}
            index={index}
            urlStartIndex={getUrlStartIndex(index)}
            remainingTime={remainingTime}
            onPreview={openPreview}
          />
        ))}
      </div>

      {hasMediaToPreview && (
        <PreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          urls={allMediaUrls}
          previewIndex={previewIndex}
          onPrevious={goToPreviewPrevious}
          onNext={goToPreviewNext}
          onIndexChange={setPreviewIndex}
        />
      )}

      {/* Log list */}
      <div
        className={cn(
          "mb-4 space-y-2",
          currentData?.data.websocket ? "block" : "hidden",
        )}
      >
        <div className="flex items-center justify-between">
          <h3 ref={wsMessagesCountRef} className="text-sm font-semibold">
            Logs (0)
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-fd-muted-foreground">Status:</span>
            <div ref={wsStatusRef} className="text-xs font-medium">
              Not connected
            </div>
          </div>
        </div>
        <div
          ref={wsMessagesContainerRef}
          className="max-h-48 overflow-y-auto space-y-2 border border-fd-border rounded-lg p-3 bg-fd-muted/30"
        />
      </div>
    </div>
  );
}
