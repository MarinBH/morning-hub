import { getItemById, updateItem } from "../../../../lib/db.js";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const item = await getItemById(Number(id));
    if (!item) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    // Content is stored in DB columns (cloud) or can be read from files (local dev)
    let markdownContent = item.markdown_content || null;
    let jsonArtifact = item.json_artifact ? tryParseJson(item.json_artifact) : null;

    // Fallback: read from local files if DB columns are empty and file_path exists
    if (!markdownContent && item.file_path) {
      const basePath = path.join(process.cwd(), "storage", "saved", item.file_path);
      const mdPath = path.join(basePath, "summary.md");
      if (fs.existsSync(mdPath)) {
        markdownContent = fs.readFileSync(mdPath, "utf-8");
      }
    }
    if (!jsonArtifact && item.file_path) {
      const basePath = path.join(process.cwd(), "storage", "saved", item.file_path);
      const jsonPath = path.join(basePath, "summary.json");
      if (fs.existsSync(jsonPath)) {
        jsonArtifact = tryParseJson(fs.readFileSync(jsonPath, "utf-8"));
      }
    }

    // Don't send raw DB columns to client (they can be large)
    const { markdown_content, json_artifact, raw_content, ...itemFields } = item;

    return Response.json({ ...itemFields, markdownContent, jsonArtifact });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const item = await getItemById(Number(id));
    if (!item) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    const allowedFields = ["personal_notes"];
    const updates = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await updateItem(Number(id), updates);
    const updated = await getItemById(Number(id));

    // Strip large content columns from response
    const { markdown_content, json_artifact, raw_content, ...fields } = updated;
    return Response.json(fields);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

function tryParseJson(str) {
  try {
    return typeof str === "object" ? str : JSON.parse(str);
  } catch {
    return null;
  }
}
