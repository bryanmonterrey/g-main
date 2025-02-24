import { createClient } from "@supabase/supabase-js"
import { useSession } from "next-auth/react";
import type { Database } from '@/types/supabase';

export const SupabaseClient = () => { 
  const { data: session } = useSession();

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: session?.supabaseAccessToken ? 
              `Bearer ${session.supabaseAccessToken}` : '',
          }
        },
        db: {
          schema: 'next_auth'
        }
      }
  );
};