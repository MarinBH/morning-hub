import { getAllTags } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tags = getAllTags();
    return Response.json({ tags });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
