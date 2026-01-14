"use client";
import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { FormValues } from "@/openapi/playground/client";
import type { FetchResult } from "@/openapi/playground/fetcher";
import { useApiContext } from "@/openapi/ui/contexts/api";
import { resolveServerUrl, withBase } from "@/openapi/utils/url";
import { OutputCard } from "./output-card";
import { PreviewDialog } from "./preview-dialog";
import type { Data, Root } from "./types";
import { useWebSocket } from "./use-websocket";

/**
 * 扩展的结果显示组件
 */
export function ResultDisplayExtended({
  data,
}: {
  data: FetchResult<unknown>;
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

  // 获取 OpenAPI context 信息
  const { serverRef } = useApiContext();
  const form = useFormContext<FormValues>();

  // 初始化数据
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

  // 获取 API base URL 和 headers
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

    // 优先使用 _encoded 中的 header（已编码格式）
    if (formValues._encoded?.header) {
      const encodedHeaders = formValues._encoded.header;
      for (const [key, param] of Object.entries(encodedHeaders)) {
        if (param && typeof param === "object" && "value" in param) {
          headers[key] = String(param.value);
        }
      }
    } else if (formValues.header) {
      // 如果没有 _encoded，从 form values 中获取
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

  // WebSocket 连接
  useWebSocket({
    websocketUrl: currentData?.data.websocket,
    enabled: currentData?.data.status === "generating",
    taskId: currentData?.data.taskId,
    getApiConfig,
    onMessage: (message) => {
      setCurrentData((prev) => (prev ? { ...prev, data: message } : null));
      if (message.status === "finished") {
        // WebSocket 会在 useWebSocket 内部关闭
      }
    },
    messagesContainerRef: wsMessagesContainerRef,
    messagesCountRef: wsMessagesCountRef,
    messagesRef: wsMessagesRef,
    statusRef: wsStatusRef,
  });

  // 倒计时逻辑
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

  // 获取所有媒体 URL（用于预览）
  const allMediaUrls: string[] = currentData
    ? (currentData.data.outputs
        ?.flatMap((output) => output.urls)
        .filter((url) => url.length > 0) ?? [])
    : [];

  // 键盘事件监听：支持左右方向键切换媒体
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

  // 计算每个 output 的 URL 起始索引
  const getUrlStartIndex = (index: number): number => {
    let urlStartIndex = 0;
    for (let i = 0; i < index; i++) {
      urlStartIndex += outputs[i]?.urls.length ?? 0;
    }
    return urlStartIndex;
  };

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

      {/* 日志列表 */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 ref={wsMessagesCountRef} className="text-sm font-semibold">
            日志 (0)
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-fd-muted-foreground">状态:</span>
            <div ref={wsStatusRef} className="text-xs font-medium">
              未连接
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
