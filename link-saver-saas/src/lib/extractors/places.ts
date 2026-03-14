import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { extractMapsPlaceInfo } from "./detect";

const FETCH_TIMEOUT_MS = 15000;

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

export async function extractPlace(url: string): Promise<PlaceMetadata> {
  const mapsInfo = extractMapsPlaceInfo(url);

  // Try to extract data from the Google Maps page itself
  let html = "";
  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    if (res.ok) html = await res.text();
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

  // If we found a website URL, scrape it for additional context
  if (result.websiteUrl) {
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
    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!res.ok) return null;

    const html = await res.text();
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
