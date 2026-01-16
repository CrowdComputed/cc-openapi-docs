import type { MediaType } from "./types";

/**
 * Determine media type based on URL extension
 */
export function getMediaType(url: string): MediaType {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const extension = pathname.split(".").pop()?.split("?")[0] || "";

    // Image types
    const imageExtensions = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "svg",
      "bmp",
      "ico",
      "avif",
    ];
    if (imageExtensions.includes(extension)) {
      return "image";
    }

    // Video types
    const videoExtensions = [
      "mp4",
      "webm",
      "ogv",
      "mov",
      "avi",
      "mkv",
      "flv",
      "wmv",
      "m4v",
    ];
    if (videoExtensions.includes(extension)) {
      return "video";
    }

    // Audio types
    const audioExtensions = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma"];
    if (audioExtensions.includes(extension)) {
      return "audio";
    }

    return "other";
  } catch {
    // If URL parsing fails, try to determine from path
    const pathname = url.toLowerCase();
    const extension = pathname.split(".").pop()?.split("?")[0] || "";

    const imageExtensions = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "svg",
      "bmp",
      "ico",
      "avif",
    ];
    if (imageExtensions.includes(extension)) {
      return "image";
    }

    const videoExtensions = [
      "mp4",
      "webm",
      "ogv",
      "mov",
      "avi",
      "mkv",
      "flv",
      "wmv",
      "m4v",
    ];
    if (videoExtensions.includes(extension)) {
      return "video";
    }

    const audioExtensions = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma"];
    if (audioExtensions.includes(extension)) {
      return "audio";
    }

    return "other";
  }
}

/**
 * Format countdown time
 */
export function formatRemainingTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(
      seconds % 60,
    ).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
