import { describe, it, expect } from "vitest";
import { KNOWLEDGE_SUMMARY_TOOL, PLACE_SUMMARY_TOOL } from "../schemas";

describe("KNOWLEDGE_SUMMARY_TOOL", () => {
  it("has correct tool name", () => {
    expect(KNOWLEDGE_SUMMARY_TOOL.name).toBe("save_knowledge_summary");
  });

  it("has all required fields", () => {
    const schema = KNOWLEDGE_SUMMARY_TOOL.input_schema as Record<string, unknown>;
    const required = schema.required as string[];
    expect(required).toContain("tldr");
    expect(required).toContain("key_takeaways");
    expect(required).toContain("actions");
    expect(required).toContain("topics");
    expect(required).toContain("concepts");
    expect(required).toContain("core_thesis");
    expect(required).toContain("author_description");
    expect(required).toContain("difficulty");
    expect(required).toContain("content_format");
  });

  it("has valid difficulty enum", () => {
    const schema = KNOWLEDGE_SUMMARY_TOOL.input_schema as Record<string, unknown>;
    const props = schema.properties as Record<string, Record<string, unknown>>;
    expect(props.difficulty.enum).toEqual(["beginner", "intermediate", "advanced"]);
  });

  it("has valid content_format enum", () => {
    const schema = KNOWLEDGE_SUMMARY_TOOL.input_schema as Record<string, unknown>;
    const props = schema.properties as Record<string, Record<string, unknown>>;
    expect(props.content_format.enum).toContain("tutorial");
    expect(props.content_format.enum).toContain("research");
    expect(props.content_format.enum).toContain("interview");
  });

  it("defines actions as array of objects with action and rationale", () => {
    const schema = KNOWLEDGE_SUMMARY_TOOL.input_schema as Record<string, unknown>;
    const props = schema.properties as Record<string, Record<string, unknown>>;
    expect(props.actions.type).toBe("array");
    const items = props.actions.items as Record<string, unknown>;
    expect(items.type).toBe("object");
    expect(items.required).toContain("action");
    expect(items.required).toContain("rationale");
  });

  it("defines goals with goal and relevance fields", () => {
    const schema = KNOWLEDGE_SUMMARY_TOOL.input_schema as Record<string, unknown>;
    const props = schema.properties as Record<string, Record<string, unknown>>;
    expect(props.goals.type).toBe("array");
    const items = props.goals.items as Record<string, unknown>;
    expect(items.required).toContain("goal");
    expect(items.required).toContain("relevance");
  });
});

describe("PLACE_SUMMARY_TOOL", () => {
  it("has correct tool name", () => {
    expect(PLACE_SUMMARY_TOOL.name).toBe("save_place_summary");
  });

  it("has all required fields", () => {
    const schema = PLACE_SUMMARY_TOOL.input_schema as Record<string, unknown>;
    const required = schema.required as string[];
    expect(required).toContain("tldr");
    expect(required).toContain("key_highlights");
    expect(required).toContain("topics");
    expect(required).toContain("place_type");
  });

  it("has valid place_type enum", () => {
    const schema = PLACE_SUMMARY_TOOL.input_schema as Record<string, unknown>;
    const props = schema.properties as Record<string, Record<string, unknown>>;
    const placeTypes = props.place_type.enum as string[];
    expect(placeTypes).toContain("restaurant");
    expect(placeTypes).toContain("cafe");
    expect(placeTypes).toContain("hotel");
    expect(placeTypes).toContain("attraction");
    expect(placeTypes).toContain("museum");
    expect(placeTypes).toContain("other");
  });

  it("has valid price_level enum", () => {
    const schema = PLACE_SUMMARY_TOOL.input_schema as Record<string, unknown>;
    const props = schema.properties as Record<string, Record<string, unknown>>;
    expect(props.price_level.enum).toEqual(["$", "$$", "$$$", "$$$$"]);
  });

  it("defines insider_tips as array of strings", () => {
    const schema = PLACE_SUMMARY_TOOL.input_schema as Record<string, unknown>;
    const props = schema.properties as Record<string, Record<string, unknown>>;
    expect(props.insider_tips.type).toBe("array");
    const items = props.insider_tips.items as Record<string, unknown>;
    expect(items.type).toBe("string");
  });
});
