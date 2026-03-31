// Shared utilities for lesson rendering across the platform

export type BlockType = "heading" | "paragraph" | "quote" | "callout" | "list" | "warning" | "video" | "separator";

export interface Block {
  id: string;
  type: BlockType;
  content?: string;
  items?: string[];
  icon?: "pin" | "bulb" | "warning" | "flag";
  videoUrl?: string;
  videoProvider?: "youtube" | "loom";
}

export interface DatabaseLesson {
  id: string;
  step_number: number;
  phase: string;
  lesson_number: number;
  title: string;
  subtitle: string;
  blocks: Block[];
  published: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Extract video ID from YouTube URL
 */
export function extractYoutubeId(url: string): string {
  let videoId = "";
  if (url.includes("youtube.com")) {
    videoId = url.split("v=")[1]?.split("&")[0] || "";
  } else if (url.includes("youtu.be")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
  }
  return videoId;
}

/**
 * Extract Loom ID from Loom URL
 */
export function extractLoomId(url: string): string {
  return url.split("/").pop()?.split("?")[0] || "";
}

/**
 * Get embed URL for a video
 */
export function getVideoEmbedUrl(
  url: string,
  provider?: "youtube" | "loom"
): string {
  if (!url) return "";

  if (provider === "youtube" || url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoId = extractYoutubeId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  } else if (provider === "loom" || url.includes("loom.com")) {
    const loomId = extractLoomId(url);
    return loomId ? `https://www.loom.com/embed/${loomId}` : "";
  }

  return "";
}

/**
 * Detect video provider from URL
 */
export function detectVideoProvider(url: string): "youtube" | "loom" | undefined {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "youtube";
  }
  if (url.includes("loom.com")) {
    return "loom";
  }
  return undefined;
}
