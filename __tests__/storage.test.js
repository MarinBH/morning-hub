import { describe, it, expect } from "vitest";
import { buildMarkdown, buildJsonArtifact, slugify } from "../lib/storage/files.js";

describe("slugify", () => {
  it("converts text to lowercase slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("What's the Deal?!")).toBe("whats-the-deal");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("one---two---three")).toBe("one-two-three");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("-hello-world-")).toBe("hello-world");
  });

  it("truncates to 60 characters", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(60);
  });
});

describe("buildJsonArtifact", () => {
  const baseArgs = {
    type: "youtube",
    metadata: {
      url: "https://youtube.com/watch?v=test",
      title: "Test Video",
      author: "Test Author",
    },
    summary: {
      tldr: "A test summary",
      core_thesis: "Testing is important",
      key_takeaways: ["Takeaway 1", "Takeaway 2"],
      topics: ["testing", "quality"],
      concepts: ["tdd", "ci/cd"],
      goals: [{ goal: "improve code quality", relevance: "direct" }],
      categories: [{ domain: "Tech & Knowledge", category: "Programming" }],
      actions: [{ action: "Write tests", rationale: "Catches bugs early" }],
      quotes_and_examples: [{ text: "Test first", source_type: "quote" }],
      frameworks: [{ name: "TDD", description: "Test-driven development" }],
      difficulty: "intermediate",
      content_format: "tutorial",
    },
  };

  it("returns schema version 2", () => {
    const result = buildJsonArtifact(baseArgs);
    expect(result.schema_version).toBe(2);
  });

  it("includes source metadata", () => {
    const result = buildJsonArtifact(baseArgs);
    expect(result.source.url).toBe("https://youtube.com/watch?v=test");
    expect(result.source.title).toBe("Test Video");
    expect(result.source.platform).toBe("YouTube");
    expect(result.source.author.name).toBe("Test Author");
  });

  it("includes summary fields", () => {
    const result = buildJsonArtifact(baseArgs);
    expect(result.summary.tldr).toBe("A test summary");
    expect(result.summary.core_thesis).toBe("Testing is important");
    expect(result.summary.key_takeaways).toHaveLength(2);
  });

  it("includes tags with 4 dimensions", () => {
    const result = buildJsonArtifact(baseArgs);
    expect(result.tags.topics).toEqual(["testing", "quality"]);
    expect(result.tags.concepts).toEqual(["tdd", "ci/cd"]);
    expect(result.tags.goals).toHaveLength(1);
    expect(result.tags.domains).toHaveLength(1);
    expect(result.tags.domains[0].domain).toBe("Tech & Knowledge");
  });

  it("includes actions with rationale", () => {
    const result = buildJsonArtifact(baseArgs);
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].action).toBe("Write tests");
    expect(result.actions[0].rationale).toBe("Catches bugs early");
  });

  it("handles empty/missing summary fields", () => {
    const result = buildJsonArtifact({
      type: "article",
      metadata: { url: "https://example.com", title: "Test" },
      summary: {},
    });
    expect(result.schema_version).toBe(2);
    expect(result.tags.topics).toEqual([]);
    expect(result.actions).toEqual([]);
    expect(result.quotes_and_examples).toEqual([]);
  });
});

describe("buildMarkdown", () => {
  it("includes YAML frontmatter", () => {
    const result = buildMarkdown({
      type: "article",
      metadata: { url: "https://example.com", title: "Test Article", author: "Author" },
      summary: { categories: [{ domain: "Tech", category: "Programming" }], topics: ["test"] },
    });
    expect(result).toContain("---");
    expect(result).toContain('title: "Test Article"');
    expect(result).toContain("type: article");
  });

  it("includes TL;DR when present", () => {
    const result = buildMarkdown({
      type: "article",
      metadata: { url: "https://example.com", title: "Test" },
      summary: { tldr: "Quick summary here", categories: [] },
    });
    expect(result).toContain("**TL;DR:** Quick summary here");
  });

  it("includes key takeaways", () => {
    const result = buildMarkdown({
      type: "youtube",
      metadata: { url: "https://youtube.com/watch?v=test", title: "Test", channel: "Channel" },
      summary: { key_takeaways: ["Point 1", "Point 2"], categories: [] },
    });
    expect(result).toContain("## Key Takeaways");
    expect(result).toContain("- Point 1");
    expect(result).toContain("- Point 2");
  });

  it("includes tags section", () => {
    const result = buildMarkdown({
      type: "article",
      metadata: { url: "https://example.com", title: "Test" },
      summary: { topics: ["react", "nextjs"], concepts: ["ssr"], categories: [] },
    });
    expect(result).toContain("## Tags");
    expect(result).toContain("`react`");
    expect(result).toContain("`ssr`");
  });
});
