"use client";
import { Loader2, XCircle } from "lucide-react";
import { MediaThumbnail } from "./media-thumbnail";
import type { Output } from "./types";
import { formatRemainingTime } from "./utils";

interface OutputCardProps {
  output: Output;
  index: number;
  urlStartIndex: number;
  remainingTime: Record<string, number>;
  onPreview: (index: number) => void;
}

/**
 * 输出卡片组件
 */
export function OutputCard({
  output,
  index,
  urlStartIndex,
  remainingTime,
  onPreview,
}: OutputCardProps) {
  const { status, urls, queueOrder, startTime, outputId } = output;
  const hasUrls = urls && urls.length > 0;

  if (status === "finished" && hasUrls && urls) {
    // 已完成：显示媒体
    return (
      <div key={outputId} className="space-y-2">
        {urls.map((url, urlIndex) => (
          <button
            key={url}
            type="button"
            className="w-full aspect-square cursor-pointer overflow-hidden rounded-lg border border-fd-border hover:border-fd-primary transition-colors"
            onClick={() => onPreview(urlStartIndex + urlIndex)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPreview(urlStartIndex + urlIndex);
              }
            }}
          >
            <MediaThumbnail url={url} index={urlStartIndex + urlIndex} />
          </button>
        ))}
      </div>
    );
  }

  // 其他状态：显示占位卡片
  return (
    <div
      key={outputId}
      className="flex items-center justify-center aspect-square rounded-lg border border-fd-border bg-fd-muted/50"
    >
      <div className="text-center space-y-2">
        {status === "generating" && (
          <>
            {startTime === 0 ? (
              // 显示队列号
              <>
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-fd-primary" />
                <p className="text-sm font-medium">队列中</p>
                <p className="text-xs text-fd-muted-foreground">
                  队列号: {queueOrder}
                </p>
              </>
            ) : (
              // 显示倒计时
              <>
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-fd-primary" />
                <p className="text-sm font-medium">生成中</p>
                {remainingTime[outputId] !== undefined && (
                  <p className="text-xs text-fd-muted-foreground font-mono">
                    {formatRemainingTime(remainingTime[outputId])}
                  </p>
                )}
              </>
            )}
          </>
        )}
        {status === "waiting" && (
          <>
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-fd-muted-foreground" />
            <p className="text-sm font-medium text-fd-muted-foreground">
              等待中
            </p>
            <p className="text-xs text-fd-muted-foreground">
              队列号: {queueOrder}
            </p>
          </>
        )}
        {status === "failed" && (
          <>
            <XCircle className="w-8 h-8 mx-auto text-fd-destructive" />
            <p className="text-sm font-medium text-fd-destructive">生成失败</p>
          </>
        )}
      </div>
    </div>
  );
}
