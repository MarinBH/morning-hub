import { listItems } from "../../../lib/db.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const domain = searchParams.get("domain") || undefined;
    const type = searchParams.get("type") || undefined;
    const search = searchParams.get("search") || undefined;
    const topic = searchParams.get("topic") || undefined;
    const concept = searchParams.get("concept") || undefined;
    const goal = searchParams.get("goal") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await listItems({ category, domain, type, search, topic, concept, goal, page, limit });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
