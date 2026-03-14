import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { extractMapsPlaceInfo } from "./detect";

const FETCH_TIMEOUT_MS = 15000;
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB

const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "169.254.169.254", // AWS metadata
  "[::1]",
];

function isSafeUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) return false;
    // Block private IP ranges
    if (/^10\./.test(hostname)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return false;
    if (/^192\.168\./.test(hostname)) return false;
    if (/^0\./.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export interface PlaceMetadata {
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  priceLevel: string | null;
  phone: string | null;
  placeType: string | null;
  websiteUrl: string | null;
  websiteContent: string | null;
  thumbnail: string | null;
  url: string;
}

function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

async function safeFetchText(url: string, options: RequestInit = {}): Promise<string> {
  const res = await fetchWithTimeout(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentLength = res.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
    throw new Error("Response too large");
  }
  const text = await res.text();
  if (text.length > MAX_RESPONSE_SIZE) {
    return text.substring(0, MAX_RESPONSE_SIZE);
  }
  return text;
}

export async function extractPlace(url: string): Promise<PlaceMetadata> {
  const mapsInfo = extractMapsPlaceInfo(url);

  // Try to extract data from the Google Maps page itself
  let html = "";
  try {
    html = await safeFetchText(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
  } catch {
    console.warn("Failed to fetch Google Maps page");
  }

  const result: PlaceMetadata = {
    name: mapsInfo.name || mapsInfo.query || "Unknown Place",
    address: null,
    latitude: null,
    longitude: null,
    rating: null,
    priceLevel: null,
    phone: null,
    placeType: null,
    websiteUrl: null,
    websiteContent: null,
    thumbnail: null,
    url,
  };

  // Try to extract coordinates from the URL
  const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    result.latitude = parseFloat(coordMatch[1]);
    result.longitude = parseFloat(coordMatch[2]);
  }

  // Extract metadata from HTML meta tags
  if (html) {
    const { document } = parseHTML(html);
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
    const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute("content");
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content");

    if (ogTitle) result.name = ogTitle;
    if (ogDesc) result.address = ogDesc;
    if (ogImage) result.thumbnail = ogImage;

    // Try to extract rating from page content
    const ratingMatch = html.match(/"ratingValue"\s*:\s*"?([\d.]+)/);
    if (ratingMatch) result.rating = parseFloat(ratingMatch[1]);

    // Try to extract price level
    const priceMatch = html.match(/"priceRange"\s*:\s*"(\$+)"/);
    if (priceMatch) result.priceLevel = priceMatch[1];

    // Try to extract website URL from page data
    const websiteMatch = html.match(/"url"\s*:\s*"(https?:\/\/(?!.*google)[^"]+)"/);
    if (websiteMatch) result.websiteUrl = websiteMatch[1];

    // Try to extract phone
    const phoneMatch = html.match(/"telephone"\s*:\s*"([^"]+)"/);
    if (phoneMatch) result.phone = phoneMatch[1];
  }

  // If we found a website URL, scrape it for additional context (with SSRF protection)
  if (result.websiteUrl && isSafeUrl(result.websiteUrl)) {
    try {
      result.websiteContent = await scrapeWebsite(result.websiteUrl);
    } catch (err) {
      console.warn("Website scraping failed:", (err as Error).message);
    }
  }

  return result;
}

async function scrapeWebsite(url: string): Promise<string | null> {
  try {
    const html = await safeFetchText(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    const { document } = parseHTML(html);

    const reader = new Readability(document);
    const result = reader.parse();

    if (result?.textContent) {
      // Truncate to reasonable size for AI processing
      return result.textContent.trim().substring(0, 10000);
    }

    return null;
  } catch {
    return null;
  }
}
