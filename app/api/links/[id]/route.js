import { getItemById, updateItem } from "../../../../lib/db.js";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const item = getItemById(Number(id));
    if (!item) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    // Read markdown summary from disk
    let markdownContent = null;
    if (item.file_path) {
      const mdPath = path.join(process.cwd(), "storage", "saved", item.file_path, "summary.md");
      if (fs.existsSync(mdPath)) {
        markdownContent = fs.readFileSync(mdPath, "utf-8");
      }
    }

    return Response.json({ ...item, markdownContent });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const item = getItemById(Number(id));
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

    updateItem(Number(id), updates);
    const updated = getItemById(Number(id));
    return Response.json(updated);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
