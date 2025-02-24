import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

declare global {
  var supabase: ReturnType<typeof createClient<Database>> | undefined;
}

export const getSupabase = (supabaseAccessToken?: string) => {
  if (globalThis.supabase) return globalThis.supabase;

  const client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: supabaseAccessToken ? `Bearer ${supabaseAccessToken}` : undefined
        }
      }
    }
  );

  if (process.env.NODE_ENV !== "production") {
    globalThis.supabase = client;
  }

  return client;
};