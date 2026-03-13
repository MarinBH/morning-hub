import { listItems, getItemById } from "../../../lib/db.js";

export const dynamic = "force-dynamic";

/**
 * Export links as markdown or JSON for NotebookLM upload.
 *
 * Query params:
 *   domain   — filter by domain slug
 *   category — filter by category slug
 *   topic    — filter by topic
 *   goal     — filter by goal
 *   format   — "markdown" (default) or "json"
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain") || undefined;
    const category = searchParams.get("category") || undefined;
    const topic = searchParams.get("topic") || undefined;
    const goal = searchParams.get("goal") || undefined;
    const format = searchParams.get("format") || "markdown";

    // Fetch all matching items (up to 100)
    const { items } = await listItems({ domain, category, topic, goal, limit: 100 });

    if (items.length === 0) {
      return Response.json({ error: "No items match the given filters" }, { status: 404 });
    }

    if (format === "json") {
      // Fetch full details with content for each item
      const fullItems = await Promise.all(
        items.map(async (item) => {
          const detail = await getItemById(item.id);
          let jsonArtifact = null;
          if (detail.json_artifact) {
            try { jsonArtifact = JSON.parse(detail.json_artifact); } catch { /* skip */ }
          }
          return { ...item, jsonArtifact };
        })
      );

      return new Response(JSON.stringify(fullItems, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="knowledge-base-export.json"`,
        },
      });
    }

    // Markdown format — concatenate all items into one document
    const fullItems = await Promise.all(
      items.map(async (item) => {
        const detail = await getItemById(item.id);
        return { ...item, markdown_content: detail.markdown_content };
      })
    );

    let markdown = `# Knowledge Base Export\n\n`;
    markdown += `Exported ${items.length} items on ${new Date().toISOString().split("T")[0]}\n\n---\n\n`;

    for (const item of fullItems) {
      if (item.markdown_content) {
        // Strip YAML frontmatter from individual items
        const content = item.markdown_content.replace(/^---[\s\S]*?---\n*/, "");
        markdown += content + "\n\n---\n\n";
      } else {
        markdown += `# ${item.title || "Untitled"}\n\n`;
        markdown += `Source: ${item.url}\n`;
        markdown += `Author: ${item.author || "Unknown"}\n`;
        if (item.summary_preview) markdown += `\n${item.summary_preview}\n`;
        markdown += "\n---\n\n";
      }
    }

    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="knowledge-base-export.md"`,
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
