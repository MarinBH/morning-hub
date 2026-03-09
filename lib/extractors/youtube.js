import { extractYouTubeVideoId } from "./detect.js";

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
    const res = await fetch(
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
  // Fetch the video page to find captions data
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(watchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!res.ok) throw new Error(`YouTube page returned ${res.status}`);
  const html = await res.text();

  // Extract captions data from the page's JSON
  const captionsMatch = html.match(/"captions":\s*(\{.*?"captionTracks".*?\})\s*,\s*"/);
  if (!captionsMatch) {
    throw new Error("No captions data found — video may not have subtitles");
  }

  let captionsData;
  try {
    // The captions JSON is nested in playerCaptionsTracklistRenderer
    const fullMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!fullMatch) throw new Error("No captionTracks found");
    captionsData = JSON.parse(fullMatch[1]);
  } catch {
    throw new Error("Failed to parse captions data");
  }

  // Prefer English, then auto-generated English, then first available
  const track =
    captionsData.find((t) => t.languageCode === "en" && !t.kind) ||
    captionsData.find((t) => t.languageCode === "en") ||
    captionsData[0];

  if (!track || !track.baseUrl) {
    throw new Error("No suitable caption track found");
  }

  // Fetch the transcript XML
  const transcriptRes = await fetch(track.baseUrl);
  if (!transcriptRes.ok) throw new Error(`Transcript fetch returned ${transcriptRes.status}`);
  const xml = await transcriptRes.text();

  // Parse XML transcript
  return parseTranscriptXml(xml);
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
    .replace(/<[^>]+>/g, ""); // strip any HTML tags
}

export function formatTranscriptText(transcript) {
  return transcript.map((entry) => entry.text).join(" ");
}

export function formatTimestamp(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
