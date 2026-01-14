import type { MediaType } from "./types";

/**
 * 根据 URL 后缀判断媒体类型
 */
export function getMediaType(url: string): MediaType {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const extension = pathname.split(".").pop()?.split("?")[0] || "";

    // 图片类型
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

    // 视频类型
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

    // 音频类型
    const audioExtensions = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma"];
    if (audioExtensions.includes(extension)) {
      return "audio";
    }

    return "other";
  } catch {
    // 如果 URL 解析失败，尝试从路径判断
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
 * 格式化倒计时时间
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
