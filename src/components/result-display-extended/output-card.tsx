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
 * Output card component
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
    // Finished: display media
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

  // Other statuses: display placeholder card
  return (
    <div
      key={outputId}
      className="flex items-center justify-center aspect-square rounded-lg border border-fd-border bg-fd-muted/50"
    >
      <div className="text-center space-y-2">
        {status === "generating" && (
          <>
            {startTime === 0 ? (
              // Display queue number
              <>
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-fd-primary" />
                <p className="text-sm font-medium">In Queue</p>
                <p className="text-xs text-fd-muted-foreground">
                  Queue: {queueOrder}
                </p>
              </>
            ) : (
              // Display countdown
              <>
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-fd-primary" />
                <p className="text-sm font-medium">Generating</p>
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
              Waiting
            </p>
            <p className="text-xs text-fd-muted-foreground">
              Queue: {queueOrder}
            </p>
          </>
        )}
        {status === "failed" && (
          <>
            <XCircle className="w-8 h-8 mx-auto text-fd-destructive" />
            <p className="text-sm font-medium text-fd-destructive">
              Generation failed
            </p>
          </>
        )}
      </div>
    </div>
  );
}
