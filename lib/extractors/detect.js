const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\//,
  /(?:https?:\/\/)?youtu\.be\//,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\//,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\//,
  /(?:https?:\/\/)?m\.youtube\.com\/watch\?/,       // mobile youtube
  /(?:https?:\/\/)?m\.youtube\.com\/shorts\//,       // mobile shorts
  /(?:https?:\/\/)?youtube\.com\/live\//,            // live streams
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/playlist/, // playlists (detect as youtube, extract first video)
];

export function detectUrlType(url) {
  for (const pattern of YOUTUBE_PATTERNS) {
    if (pattern.test(url)) return "youtube";
  }
  return "article";
}

export function extractYouTubeVideoId(url) {
  // youtube.com/watch?v=ID (desktop and mobile)
  let match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  // youtu.be/ID (share links from mobile)
  match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  // youtube.com/shorts/ID (desktop and mobile)
  match = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  // youtube.com/embed/ID
  match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  // youtube.com/live/ID
  match = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  return null;
}

// Clean up URLs (normalize mobile to standard, strip tracking params)
export function normalizeUrl(url) {
  try {
    const parsed = new URL(url.trim());

    // Normalize mobile YouTube to standard
    if (parsed.hostname === "m.youtube.com") {
      parsed.hostname = "www.youtube.com";
    }

    // Remove common tracking params
    const trackingParams = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "si", "feature", "fbclid", "gclid"];
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }

    return parsed.toString();
  } catch {
    return url.trim();
  }
}

export function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
