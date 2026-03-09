import { extractYouTubeVideoId } from "./detect.js";

const FETCH_TIMEOUT_MS = 15000;

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

export async function extractYouTube(url) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("Could not extract YouTube video ID from URL");
  }

  // Fetch metadata via oEmbed
  const metadata = await fetchOEmbed(url);

  // Fetch transcript
  let transcript = [];
  let hasTranscript = false;
  try {
    transcript = await fetchTranscript(videoId);
    hasTranscript = transcript.length > 0;
  } catch (err) {
    console.warn(`Transcript extraction failed for ${videoId}:`, err.message);
  }

  return {
    videoId,
    title: metadata.title || `YouTube Video ${videoId}`,
    channel: metadata.author_name || "Unknown",
    thumbnail: metadata.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    transcript,
    hasTranscript,
    url,
  };
}

async function fetchOEmbed(url) {
  try {
    const res = await fetchWithTimeout(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    );
    if (!res.ok) throw new Error(`oEmbed returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("oEmbed fetch failed:", err.message);
    return {};
  }
}

async function fetchTranscript(videoId) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetchWithTimeout(watchUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!res.ok) throw new Error(`YouTube page returned ${res.status}`);
  const html = await res.text();

  // Try multiple extraction strategies in order of reliability
  const captionsData = extractCaptionTracks(html);
  if (!captionsData || captionsData.length === 0) {
    throw new Error("No captions found — video may not have subtitles");
  }

  // Prefer: manual English → auto-generated English → any English → first available
  const track =
    captionsData.find((t) => t.languageCode === "en" && !t.kind) ||
    captionsData.find((t) => t.languageCode === "en") ||
    captionsData.find((t) => t.languageCode?.startsWith("en")) ||
    captionsData[0];

  if (!track?.baseUrl) {
    throw new Error("No suitable caption track found");
  }

  const transcriptRes = await fetchWithTimeout(track.baseUrl);
  if (!transcriptRes.ok) throw new Error(`Transcript fetch returned ${transcriptRes.status}`);
  const xml = await transcriptRes.text();

  return parseTranscriptXml(xml);
}

/**
 * Extract captionTracks array from YouTube page HTML.
 * Tries multiple patterns in order of reliability — YouTube changes their HTML structure frequently.
 */
function extractCaptionTracks(html) {
  // Strategy 1: Parse from ytInitialPlayerResponse JSON block (most reliable)
  const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/s);
  if (playerResponseMatch) {
    try {
      const playerResponse = JSON.parse(playerResponseMatch[1]);
      const tracks =
        playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (tracks?.length) return tracks;
    } catch {
      // fall through to next strategy
    }
  }

  // Strategy 2: Direct captionTracks array extraction (legacy pattern)
  const directMatch = html.match(/"captionTracks"\s*:\s*(\[[\s\S]*?\])\s*,\s*"audio/);
  if (directMatch) {
    try {
      return JSON.parse(directMatch[1]);
    } catch {
      // fall through
    }
  }

  // Strategy 3: Broader captionTracks extraction (fallback)
  const broadMatch = html.match(/"captionTracks"\s*:\s*(\[[\s\S]{10,5000}?\])/);
  if (broadMatch) {
    try {
      return JSON.parse(broadMatch[1]);
    } catch {
      // fall through
    }
  }

  return null;
}

function parseTranscriptXml(xml) {
  const entries = [];
  const regex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    const text = decodeXmlEntities(match[3]).trim();
    if (text) {
      entries.push({ start, duration, text });
    }
  }

  return entries;
}

function decodeXmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<[^>]+>/g, "");
}

export function formatTranscriptText(transcript) {
  return transcript.map((entry) => entry.text).join(" ");
}

export function formatTimestamp(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
