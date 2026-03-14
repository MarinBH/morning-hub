import { describe, it, expect } from "vitest";
import {
  detectUrlType,
  getSectionForType,
  extractYouTubeVideoId,
  extractMapsPlaceInfo,
  normalizeUrl,
  isValidUrl,
} from "../detect";

describe("detectUrlType", () => {
  describe("YouTube URLs", () => {
    it("detects standard watch URLs", () => {
      expect(detectUrlType("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("youtube");
      expect(detectUrlType("https://youtube.com/watch?v=dQw4w9WgXcQ")).toBe("youtube");
      expect(detectUrlType("http://www.youtube.com/watch?v=abc123_-XYZ")).toBe("youtube");
    });

    it("detects short URLs", () => {
      expect(detectUrlType("https://youtu.be/dQw4w9WgXcQ")).toBe("youtube");
      expect(detectUrlType("http://youtu.be/abc123_-XYZ")).toBe("youtube");
    });

    it("detects shorts URLs", () => {
      expect(detectUrlType("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("youtube");
      expect(detectUrlType("https://youtube.com/shorts/abc123")).toBe("youtube");
    });

    it("detects embed URLs", () => {
      expect(detectUrlType("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("youtube");
    });

    it("detects mobile URLs", () => {
      expect(detectUrlType("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("youtube");
      expect(detectUrlType("https://m.youtube.com/shorts/abc123")).toBe("youtube");
    });

    it("detects live URLs", () => {
      expect(detectUrlType("https://youtube.com/live/dQw4w9WgXcQ")).toBe("youtube");
    });

    it("detects playlist URLs", () => {
      expect(detectUrlType("https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf")).toBe("youtube");
    });
  });

  describe("Google Maps URLs", () => {
    it("detects google.com/maps URLs", () => {
      expect(detectUrlType("https://www.google.com/maps/place/Eiffel+Tower")).toBe("place");
      expect(detectUrlType("https://google.com/maps/@48.8584,2.2945,17z")).toBe("place");
    });

    it("detects maps.google.com URLs", () => {
      expect(detectUrlType("https://maps.google.com/?q=Paris")).toBe("place");
    });

    it("detects short maps URLs", () => {
      expect(detectUrlType("https://goo.gl/maps/abc123")).toBe("place");
      expect(detectUrlType("https://maps.app.goo.gl/abc123")).toBe("place");
    });
  });

  describe("Article URLs (fallback)", () => {
    it("detects regular website URLs as articles", () => {
      expect(detectUrlType("https://example.com/article/hello-world")).toBe("article");
      expect(detectUrlType("https://medium.com/@user/some-post-abc123")).toBe("article");
      expect(detectUrlType("https://nytimes.com/2026/03/14/tech/ai.html")).toBe("article");
    });

    it("treats unknown URLs as articles", () => {
      expect(detectUrlType("https://some-random-site.io/page")).toBe("article");
    });
  });
});

describe("getSectionForType", () => {
  it("maps place to places section", () => {
    expect(getSectionForType("place")).toBe("places");
  });

  it("maps youtube to knowledge section", () => {
    expect(getSectionForType("youtube")).toBe("knowledge");
  });

  it("maps article to knowledge section", () => {
    expect(getSectionForType("article")).toBe("knowledge");
  });
});

describe("extractYouTubeVideoId", () => {
  it("extracts from standard watch URLs", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from URLs with extra params", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?list=PLrAXtm&v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from short URLs", () => {
    expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=30")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from shorts URLs", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from embed URLs", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from live URLs", () => {
    expect(extractYouTubeVideoId("https://youtube.com/live/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("returns null for non-YouTube URLs", () => {
    expect(extractYouTubeVideoId("https://example.com")).toBeNull();
    expect(extractYouTubeVideoId("https://vimeo.com/123456")).toBeNull();
  });

  it("returns null for playlist-only URLs", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf")).toBeNull();
  });

  it("handles IDs with hyphens and underscores", () => {
    // YouTube video IDs are always exactly 11 characters
    expect(extractYouTubeVideoId("https://youtu.be/abc-_12-XYZ")).toBe("abc-_12-XYZ");
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=a-b_c-d_e-f")).toBe("a-b_c-d_e-f");
  });
});

describe("extractMapsPlaceInfo", () => {
  it("extracts place name from /maps/place/ URLs", () => {
    const result = extractMapsPlaceInfo("https://www.google.com/maps/place/Eiffel+Tower/@48.8584,2.2945");
    expect(result.name).toBe("Eiffel Tower");
  });

  it("extracts query from ?q= parameter", () => {
    const result = extractMapsPlaceInfo("https://maps.google.com/?q=Central+Park");
    expect(result.query).toBe("Central Park");
  });

  it("handles encoded place names", () => {
    const result = extractMapsPlaceInfo("https://www.google.com/maps/place/Caf%C3%A9+de+Flore/@48.8541");
    expect(result.name).toBe("Café de Flore");
  });

  it("returns empty object for maps URLs without place info", () => {
    const result = extractMapsPlaceInfo("https://www.google.com/maps/@48.8584,2.2945,17z");
    expect(result).toEqual({});
  });

  it("handles invalid URLs gracefully", () => {
    const result = extractMapsPlaceInfo("not-a-url");
    expect(result).toEqual({});
  });
});

describe("normalizeUrl", () => {
  it("strips tracking parameters", () => {
    const url = normalizeUrl("https://example.com/article?utm_source=twitter&utm_medium=social&ref=abc");
    expect(url).not.toContain("utm_source");
    expect(url).not.toContain("utm_medium");
    expect(url).not.toContain("ref=");
  });

  it("preserves non-tracking parameters", () => {
    const url = normalizeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120");
    expect(url).toContain("v=dQw4w9WgXcQ");
    expect(url).toContain("t=120");
  });

  it("normalizes mobile YouTube to www", () => {
    const url = normalizeUrl("https://m.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(url).toContain("www.youtube.com");
    expect(url).not.toContain("m.youtube.com");
  });

  it("strips YouTube si param", () => {
    const url = normalizeUrl("https://youtu.be/dQw4w9WgXcQ?si=abc123");
    expect(url).not.toContain("si=");
  });

  it("strips Facebook/Google click IDs", () => {
    const url = normalizeUrl("https://example.com/page?fbclid=abc&gclid=xyz");
    expect(url).not.toContain("fbclid");
    expect(url).not.toContain("gclid");
  });

  it("handles invalid URLs by trimming", () => {
    expect(normalizeUrl("  not-a-url  ")).toBe("not-a-url");
  });

  it("trims whitespace from valid URLs", () => {
    const url = normalizeUrl("  https://example.com  ");
    expect(url).toBe("https://example.com/");
  });
});

describe("isValidUrl", () => {
  it("accepts http URLs", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
  });

  it("accepts https URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
  });

  it("rejects non-http protocols", () => {
    expect(isValidUrl("ftp://example.com")).toBe(false);
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
    expect(isValidUrl("data:text/html,<h1>hi</h1>")).toBe(false);
  });

  it("rejects non-URLs", () => {
    expect(isValidUrl("not a url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("example.com")).toBe(false);
  });
});
