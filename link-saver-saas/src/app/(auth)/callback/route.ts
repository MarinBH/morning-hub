import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if user is new (no saved links yet)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase
          .from("links")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (count === 0) {
          return NextResponse.redirect(`${origin}/welcome`);
        }
      }
      return NextResponse.redirect(`${origin}/knowledge`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
