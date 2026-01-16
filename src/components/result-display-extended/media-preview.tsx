"use client";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { getMediaType } from "./utils";

interface MediaPreviewProps {
  url: string;
  previewIndex: number;
}

/**
 * Media preview component
 */
export function MediaPreview({ url, previewIndex }: MediaPreviewProps) {
  const mediaType = getMediaType(url);

  switch (mediaType) {
    case "image":
      return (
        <Image
          src={url}
          alt={`Preview ${previewIndex + 1}`}
          width={1200}
          height={1200}
          className="max-w-full max-h-full object-contain"
        />
      );
    case "video":
      return (
        <video
          src={url}
          controls
          autoPlay
          className="max-w-full max-h-full"
          aria-label={`Video preview ${previewIndex + 1}`}
        >
          <track kind="captions" />
        </video>
      );
    case "audio":
      return (
        <div className="w-full max-w-2xl">
          <audio
            src={url}
            controls
            className="w-full"
            aria-label={`Audio preview ${previewIndex + 1}`}
          >
            <track kind="captions" />
          </audio>
        </div>
      );
    default:
      return (
        <div className="text-center">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ color: "primary" }),
              "inline-flex items-center gap-2",
            )}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-label="Download"
            >
              <title>Download</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download file
          </a>
        </div>
      );
  }
}
