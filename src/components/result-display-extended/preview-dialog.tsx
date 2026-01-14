"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { Dialog, DialogContent } from "@/openapi/ui/components/dialog";
import { cn } from "@/lib/cn";
import { MediaPreview } from "./media-preview";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  urls: string[];
  previewIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onIndexChange: (index: number) => void;
}

/**
 * 媒体预览对话框组件
 */
export function PreviewDialog({
  open,
  onOpenChange,
  urls,
  previewIndex,
  onPrevious,
  onNext,
  onIndexChange,
}: PreviewDialogProps) {
  if (urls.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen max-h-screen w-screen h-screen p-0 m-0 rounded-none left-0 top-0 translate-x-0 translate-y-0">
        <div className="relative flex items-center justify-center w-full h-full">
          {urls.length > 1 && (
            <>
              <button
                type="button"
                onClick={onPrevious}
                className={cn(
                  buttonVariants({
                    color: "secondary",
                    size: "icon",
                  }),
                  "absolute left-4 z-10",
                )}
                aria-label="Previous media"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={onNext}
                className={cn(
                  buttonVariants({
                    color: "secondary",
                    size: "icon",
                  }),
                  "absolute right-4 z-10",
                )}
                aria-label="Next media"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          )}
          <div className="flex items-center justify-center w-full h-full p-8">
            <MediaPreview url={urls[previewIndex]} previewIndex={previewIndex} />
          </div>
          {urls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-fd-popover/80 backdrop-blur-sm px-4 py-2 rounded-full">
              {urls.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => onIndexChange(index)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === previewIndex
                      ? "w-8 bg-fd-primary"
                      : "w-2 bg-fd-muted-foreground",
                  )}
                  aria-label={`Go to media ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
