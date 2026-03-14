import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !key) {
    // During build/prerender, return a stub that won't crash
    if (typeof window === "undefined") {
      return createBrowserClient("https://placeholder.supabase.co", "placeholder");
    }
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copy .env.local.example to .env.local and fill in your Supabase credentials."
    );
  }

  return createBrowserClient(url, key);
}
