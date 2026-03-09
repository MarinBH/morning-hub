import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

const FETCH_TIMEOUT_MS = 15000;

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

// Readability must extract at least this much meaningful content to be trusted.
// Below this, we fall back to OG/meta tags to avoid summarizing nav/footer junk.
const MIN_WORD_COUNT = 100;
const MIN_CHAR_COUNT = 500;

export async function extractArticle(url) {
  const html = await fetchHtml(url);
  const { document } = parseHTML(html);

  let result;
  try {
    const reader = new Readability(document);
    result = reader.parse();
  } catch (err) {
    console.warn("Readability parse failed:", err.message);
  }

  const wordCount = result?.textContent
    ? result.textContent.trim().split(/\s+/).filter(Boolean).length
    : 0;

  if (
    !result ||
    !result.textContent ||
    result.textContent.trim().length < MIN_CHAR_COUNT ||
    wordCount < MIN_WORD_COUNT
  ) {
    return extractFallback(document, url);
  }

  const readingTime = Math.ceil(wordCount / 200);

  return {
    title: result.title || extractMetaContent(document, "og:title") || "Untitled",
    author: result.byline || extractMetaContent(document, "author") || null,
    siteName:
      result.siteName ||
      extractMetaContent(document, "og:site_name") ||
      new URL(url).hostname,
    publishedTime: extractMetaContent(document, "article:published_time") || null,
    readingTime,
    textContent: result.textContent.trim(),
    excerpt: result.excerpt || result.textContent.substring(0, 300).trim(),
    url,
    isPartial: false,
  };
}

function extractFallback(document, url) {
  const title =
    extractMetaContent(document, "og:title") ||
    document.querySelector("title")?.textContent ||
    "Untitled";

  const description =
    extractMetaContent(document, "og:description") ||
    extractMetaContent(document, "description") ||
    "";

  return {
    title,
    author: extractMetaContent(document, "author") || null,
    siteName: extractMetaContent(document, "og:site_name") || new URL(url).hostname,
    publishedTime: extractMetaContent(document, "article:published_time") || null,
    readingTime: null,
    textContent: description,
    excerpt: description.substring(0, 300),
    url,
    isPartial: true,
  };
}

function extractMetaContent(document, name) {
  const meta =
    document.querySelector(`meta[property="${name}"]`) ||
    document.querySelector(`meta[name="${name}"]`);
  return meta?.getAttribute("content") || null;
}

async function fetchHtml(url) {
  const res = await fetchWithTimeout(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch article: HTTP ${res.status}`);
  }

  return await res.text();
}
