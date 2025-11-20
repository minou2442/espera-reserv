import { createBrowserClient } from "@supabase/ssr"

// Use globalThis to ensure a true singleton across all imports
declare global {
  var supabaseClientInstance: ReturnType<typeof createBrowserClient> | undefined
}

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseClient can only be called in the browser")
  }

  if (!globalThis.supabaseClientInstance) {
    globalThis.supabaseClientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }

  return globalThis.supabaseClientInstance
}
