import { createBrowserClient } from "@supabase/ssr";

// Falls back to placeholder values so the client can be constructed even
// when Supabase isn't configured (e.g. a UI-only preview deploy) — auth
// calls will fail at runtime instead of crashing the page at build time.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
  );
}
