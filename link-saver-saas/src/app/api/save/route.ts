import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Bookmarklet endpoint — accepts a URL via query param, saves it, and redirects to the app.
 * Usage: GET /api/save?url=https://example.com
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in — redirect to login with return URL
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `/api/save?url=${encodeURIComponent(url)}`);
    return NextResponse.redirect(loginUrl);
  }

  // Save the link via the existing processing endpoint
  try {
    const origin = request.nextUrl.origin;
    const res = await fetch(`${origin}/api/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({ url }),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.redirect(new URL(`/link/${data.id}`, request.url));
    }
  } catch {
    // Fall through to home
  }

  return NextResponse.redirect(new URL("/home", request.url));
}
