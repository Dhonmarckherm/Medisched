import { createBrowserClient } from "@supabase/ssr";

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During prerendering on Vercel, env vars may not be available yet
  // Return a dummy client that won't be used (data fetching happens in useEffect)
  if (!supabaseUrl || !supabaseKey) {
    return {
      auth: { getUser: async () => ({ data: { user: null } }) },
      from: () => ({
        select: () => ({ eq: async () => ({ data: null }), order: () => ({ eq: async () => ({ data: null }), limit: () => ({ eq: () => ({ data: null }) }) }), limit: () => ({ eq: () => ({ data: null }), maybeSingle: async () => ({ data: null }) }), maybeSingle: async () => ({ data: null }) }),
        insert: async () => ({ error: null }),
        update: () => ({ eq: async () => ({ error: null }) }),
      }),
    } as any;
  }

  supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
}
