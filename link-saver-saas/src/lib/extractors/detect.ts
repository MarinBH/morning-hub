export type LinkType = "youtube" | "article" | "place";
export type Section = "knowledge" | "places";

const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\//,
  /(?:https?:\/\/)?youtu\.be\//,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\//,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\//,
  /(?:https?:\/\/)?m\.youtube\.com\/watch\?/,
  /(?:https?:\/\/)?m\.youtube\.com\/shorts\//,
  /(?:https?:\/\/)?youtube\.com\/live\//,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/playlist/,
];

const MAPS_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?google\.com\/maps/,
  /(?:https?:\/\/)?maps\.google\.com/,
  /(?:https?:\/\/)?goo\.gl\/maps/,
  /(?:https?:\/\/)?maps\.app\.goo\.gl/,
  /(?:https?:\/\/)?(?:www\.)?google\.com\/maps\/place/,
];

export function detectUrlType(url: string): LinkType {
  for (const pattern of YOUTUBE_PATTERNS) {
    if (pattern.test(url)) return "youtube";
  }
  for (const pattern of MAPS_PATTERNS) {
    if (pattern.test(url)) return "place";
  }
  return "article";
}

export function getSectionForType(type: LinkType): Section {
  return type === "place" ? "places" : "knowledge";
}

export function extractYouTubeVideoId(url: string): string | null {
  let match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  match = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  match = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  return null;
}

export function extractMapsPlaceInfo(url: string): { name?: string; query?: string } {
  try {
    const parsed = new URL(url);

    // google.com/maps/place/Place+Name/...
    const placeMatch = url.match(/\/maps\/place\/([^/@]+)/);
    if (placeMatch) {
      return { name: decodeURIComponent(placeMatch[1].replace(/\+/g, " ")) };
    }

    // google.com/maps?q=...
    const query = parsed.searchParams.get("q") || parsed.searchParams.get("query");
    if (query) {
      return { query: decodeURIComponent(query) };
    }

    return {};
  } catch {
    return {};
  }
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());

    if (parsed.hostname === "m.youtube.com") {
      parsed.hostname = "www.youtube.com";
    }

    const trackingParams = [
      "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id",
      "si", "pp", "feature",
      "fbclid", "gclid", "gbraid", "wbraid", "dclid",
      "ref", "ref_src", "ref_url",
      "mc_cid", "mc_eid",
      "_hsenc", "_hsmi",
      "mkt_tok",
    ];
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }

    return parsed.toString();
  } catch {
    return url.trim();
  }
}

export function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
