import { describe, it, expect } from "vitest";
import { detectUrlType, extractYouTubeVideoId, normalizeUrl, isValidUrl } from "../lib/extractors/detect.js";

describe("detectUrlType", () => {
  it("detects standard YouTube URLs", () => {
    expect(detectUrlType("https://www.youtube.com/watch?v=abc123def45")).toBe("youtube");
  });

  it("detects mobile YouTube URLs", () => {
    expect(detectUrlType("https://m.youtube.com/watch?v=abc123def45")).toBe("youtube");
  });

  it("detects YouTube shorts", () => {
    expect(detectUrlType("https://www.youtube.com/shorts/abc123def45")).toBe("youtube");
    expect(detectUrlType("https://m.youtube.com/shorts/abc123def45")).toBe("youtube");
  });

  it("detects youtu.be share links", () => {
    expect(detectUrlType("https://youtu.be/abc123def45")).toBe("youtube");
  });

  it("detects YouTube embeds", () => {
    expect(detectUrlType("https://www.youtube.com/embed/abc123def45")).toBe("youtube");
  });

  it("detects YouTube live streams", () => {
    expect(detectUrlType("https://youtube.com/live/abc123def45")).toBe("youtube");
  });

  it("detects YouTube playlists", () => {
    expect(detectUrlType("https://www.youtube.com/playlist?list=PLxyz")).toBe("youtube");
  });

  it("returns article for non-YouTube URLs", () => {
    expect(detectUrlType("https://example.com/article")).toBe("article");
    expect(detectUrlType("https://paulgraham.com/greatwork.html")).toBe("article");
    expect(detectUrlType("https://hbr.org/2024/01/article")).toBe("article");
  });
});

describe("extractYouTubeVideoId", () => {
  it("extracts ID from standard watch URL", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from youtu.be share link", () => {
    expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from shorts URL", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from embed URL", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from live URL", () => {
    expect(extractYouTubeVideoId("https://youtube.com/live/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID with extra params", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=abc123&t=30")).toBe("dQw4w9WgXcQ");
  });

  it("returns null for non-YouTube URLs", () => {
    expect(extractYouTubeVideoId("https://example.com")).toBe(null);
  });
});

describe("normalizeUrl", () => {
  it("normalizes mobile YouTube to desktop", () => {
    const result = normalizeUrl("https://m.youtube.com/watch?v=abc123def45");
    expect(result).toContain("www.youtube.com");
    expect(result).not.toContain("m.youtube.com");
  });

  it("strips tracking parameters", () => {
    const result = normalizeUrl("https://example.com/page?utm_source=twitter&utm_medium=social&key=value");
    expect(result).not.toContain("utm_source");
    expect(result).not.toContain("utm_medium");
    expect(result).toContain("key=value");
  });

  it("strips YouTube si parameter", () => {
    const result = normalizeUrl("https://youtu.be/abc123def45?si=longtrackingtoken");
    expect(result).not.toContain("si=");
  });

  it("strips Facebook fbclid", () => {
    const result = normalizeUrl("https://example.com/page?fbclid=abc123");
    expect(result).not.toContain("fbclid");
  });

  it("handles invalid URLs gracefully", () => {
    expect(normalizeUrl("not a url")).toBe("not a url");
  });

  it("trims whitespace", () => {
    expect(normalizeUrl("  https://example.com  ")).toBe("https://example.com/");
  });
});

describe("isValidUrl", () => {
  it("accepts http URLs", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
  });

  it("accepts https URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
  });

  it("rejects javascript: URLs", () => {
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects data: URLs", () => {
    expect(isValidUrl("data:text/html,<h1>hi</h1>")).toBe(false);
  });

  it("rejects ftp: URLs", () => {
    expect(isValidUrl("ftp://example.com")).toBe(false);
  });

  it("rejects plain text", () => {
    expect(isValidUrl("not a url")).toBe(false);
  });
});
