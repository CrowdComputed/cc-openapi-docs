"use client";
import { getMediaType } from "./utils";
import type { MediaType } from "./types";

interface MediaThumbnailProps {
  url: string;
  index: number;
}

/**
 * 媒体缩略图组件
 */
export function MediaThumbnail({ url, index }: MediaThumbnailProps) {
  const mediaType = getMediaType(url);

  switch (mediaType) {
    case "image":
      return (
        <img
          alt={`Media ${index + 1}`}
          width={500}
          height={500}
          src={url}
          className="w-full h-full object-contain"
        />
      );
    case "video":
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-fd-muted">
          <video
            src={url}
            className="w-full h-full object-contain"
            preload="metadata"
            aria-label={`Video ${index + 1}`}
          >
            <track kind="captions" />
          </video>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-fd-popover/80 backdrop-blur-sm flex items-center justify-center">
              <svg
                className="w-8 h-8 text-fd-foreground"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-label="Play video"
              >
                <title>Play video</title>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      );
    case "audio":
      return (
        <div className="w-full h-full flex items-center justify-center bg-fd-muted">
          <div className="text-center">
            <svg
              className="w-16 h-16 mx-auto text-fd-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-label="Audio file"
            >
              <title>Audio file</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            <p className="mt-2 text-sm text-fd-muted-foreground">音频</p>
          </div>
        </div>
      );
    default:
      return (
        <div className="w-full h-full flex items-center justify-center bg-fd-muted">
          <div className="text-center">
            <svg
              className="w-16 h-16 mx-auto text-fd-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-label="File"
            >
              <title>File</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-fd-muted-foreground">文件</p>
          </div>
        </div>
      );
  }
}
