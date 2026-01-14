"use client";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { FetchResult } from "@/openapi/playground/fetcher";
import { Dialog, DialogContent } from "@/openapi/ui/components/dialog";

export interface Root {
  code: "Success" | "Failed";
  message: string;
  data: Data;
}

export interface Data {
  taskId?: string;
  status?: string;
  outputs?: Output[];
  balance: number;
  spend: number;
  websocket?: string;
}

export interface Output {
  outputId: string;
  status: string;
  urls: string[];
  estimateMs: number;
  queueOrder: number;
  startTime: number;
  endTime: number;
}

export function ResultDisplayExtended({
  data,
}: {
  data: FetchResult<unknown>;
}) {
  console.log(data);

  // 必须在所有条件返回之前调用 hooks
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // 提前获取图片数组（如果数据有效）
  let allImages: string[] = [];
  if (data.status === 200) {
    const rootData = data.data as Root;
    if (
      rootData &&
      typeof rootData === "object" &&
      "code" in rootData &&
      rootData.code !== "Failed"
    ) {
      const outputs = rootData.data.outputs ?? [];
      allImages = outputs.flatMap((output) => output.urls);
    }
  }

  // 键盘事件监听：支持左右方向键切换图片
  useEffect(() => {
    if (!previewOpen || allImages.length <= 1) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPreviewIndex((prev) =>
          prev === 0 ? allImages.length - 1 : prev - 1,
        );
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPreviewIndex((prev) =>
          prev === allImages.length - 1 ? 0 : prev + 1,
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
  }, [previewOpen, allImages.length]);

  if (data.status !== 200) {
    return null;
  }

  // 类型守卫：检查 data.data 是否符合 Root 类型
  const rootData = data.data as Root;
  if (!rootData || typeof rootData !== "object" || !("code" in rootData)) {
    return null;
  }

  if (rootData.code === "Failed") {
    return null;
  }

  const outputs = rootData.data.outputs ?? [];
  if (outputs.length === 0) {
    return null;
  }

  const goToPreviewPrevious = () => {
    setPreviewIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToPreviewNext = () => {
    setPreviewIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  if (allImages.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-4 p-3">
        {allImages.map((url, index) => (
          <button
            key={url}
            type="button"
            className="w-full h-full cursor-pointer"
            onClick={() => openPreview(index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openPreview(index);
              }
            }}
          >
            <img
              alt={url}
              width={500}
              height="auto"
              src={url}
              style={{ objectFit: "contain" }}
            />
          </button>
        ))}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-screen max-h-screen w-screen h-screen p-0 m-0 rounded-none left-0 top-0 translate-x-0 translate-y-0">
          <div className="relative flex items-center justify-center w-full h-full">
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPreviewPrevious}
                  className={cn(
                    buttonVariants({
                      color: "secondary",
                      size: "icon",
                    }),
                    "absolute left-4 z-10",
                  )}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={goToPreviewNext}
                  className={cn(
                    buttonVariants({
                      color: "secondary",
                      size: "icon",
                    }),
                    "absolute right-4 z-10",
                  )}
                  aria-label="Next image"
                >
                  <ChevronRight className="size-4" />
                </button>
              </>
            )}
            <div className="flex items-center justify-center w-full h-full p-8">
              <Image
                src={allImages[previewIndex]}
                alt={`Preview ${previewIndex + 1}`}
                width={1200}
                height={1200}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-fd-popover/80 backdrop-blur-sm px-4 py-2 rounded-full">
                {allImages.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setPreviewIndex(index)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      index === previewIndex
                        ? "w-8 bg-fd-primary"
                        : "w-2 bg-fd-muted-foreground",
                    )}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
