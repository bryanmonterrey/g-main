// lib/auth-service.server.ts
import { useSession } from 'next-auth/react';
import { getSupabase } from '@/utils/supabase/getDataWhenAuth';
import type { Database } from '@/types/supabase';

export const getSelf = async (session: any) => { //fixed getself by username
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const supabase = getSupabase(session);
  
  const { data: user, error } = await supabase
    .from('users' as any)
    .select(`
      id,
      username,
      email,
      avatar_url,
      wallet_address,
      bio,
      created_at,
      updated_at
    `)
    .eq('id', session.user.id)  // Changed from wallet_address to id becuase of nextauth
    .single();

  if (error || !user) {
    throw new Error("Not found");
  }

  return user;
};

//fix getself by username

export const getSelfByUsername = async (username: string, session: any) => {
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const supabase = getSupabase(session);
  
  const { data: user, error } = await supabase
    .from('users' as any)
    .select(`
      id,
      username,
      email,
      avatar_url,
      wallet_address,
      bio,
      created_at,
      updated_at
    `)
    .eq('username', username)
    .single();

  if (error || !user) {
    throw new Error("User not found");
  }

  // Check if the authenticated user is the same as the requested user
  // Using walletAddress from the session since that's what your NextAuth setup provides
  if (session.user.walletAddress !== user.wallet_address) {
    throw new Error("Unauthorized");
  }

  return user;
};

// Add TypeScript types for better type safety
interface User {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  wallet_address: string;
  bio: string | null;
  created_at: string;
  updated_at: string;
  subscription?: {
    stripe_customer_id: string;
  } | null;
}