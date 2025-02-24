// lib/db.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

declare global {
  var supabase: ReturnType<typeof createClient<Database>> | undefined;
}

// Updated to use session object directly
export const getSupabase = (session: any) => {
  if (!session?.supabaseAccessToken) {
    // Return client without auth for public data
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );
  }

  // Return authenticated client
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${session.supabaseAccessToken}`,
        },
      },
      auth: {
        persistSession: false
      },
      db: {
        schema: 'next_auth'
      }
    }
  );
};

// Usage example:
// const { data: session } = useSession();
// const supabase = getSupabase(session);






// import { useSession } from 'next-auth/react';
// import { getSupabase } from '@/lib/db';
//
// export const YourComponent = () => {
//   const { data: session } = useSession();
//   const supabase = getSupabase(session);
  
//   const getData = async () => {
//     const { data, error } = await supabase
//       .from('users')
//       .select('*');
//     // ...
//   };
// };