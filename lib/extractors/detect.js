const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\//,
  /(?:https?:\/\/)?youtu\.be\//,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\//,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\//,
];

export function detectUrlType(url) {
  for (const pattern of YOUTUBE_PATTERNS) {
    if (pattern.test(url)) return "youtube";
  }
  return "article";
}

export function extractYouTubeVideoId(url) {
  // youtube.com/watch?v=ID
  let match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  // youtu.be/ID
  match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  // youtube.com/shorts/ID
  match = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  // youtube.com/embed/ID
  match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  return null;
}

export function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
