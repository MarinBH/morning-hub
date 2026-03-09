import { getAllDomainsWithCategories, addCategory, removeCategory } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const domains = getAllDomainsWithCategories();
    return Response.json({ domains });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// Add a new category to a domain
export async function POST(request) {
  try {
    const { domainSlug, name } = await request.json();
    if (!domainSlug || !name) {
      return Response.json({ error: "domainSlug and name are required" }, { status: 400 });
    }
    const category = addCategory(domainSlug, name);
    return Response.json(category);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// Remove a custom category
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("id");
    if (!categoryId) {
      return Response.json({ error: "Category id is required" }, { status: 400 });
    }
    removeCategory(Number(categoryId));
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
