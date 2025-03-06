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

  // For web3 authentication, we need to check the wallet address
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

export const getSelfById = async (userId: string, session: any) => {
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
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error("User not found");
  }

  // Security check - only allow users to access their own data
  // For web3 authentication, we need to check the wallet address
  if (session.user.walletAddress !== user.wallet_address) {
    throw new Error("Unauthorized");
  }

  return user;
};

export const getSelfByWalletAddress = async (walletAddress: string, session: any) => {
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check authorization by comparing wallet addresses
  if (session.user.walletAddress !== walletAddress) {
    throw new Error("Unauthorized");
  }

  // Return user data from the session
  return {
    id: session.user.id,
    email: session.user.email || null,
    username: session.user.name || null,
    avatar_url: session.user.image || null,
    wallet_address: session.user.walletAddress,
    bio: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

// Add a new function to get any user's profile
export const getUserByUsername = async (username: string, session: any) => {
  const supabase = getSupabase(session);
  
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id,
      username,
      avatar_url,
      wallet_address,
      bio,
      created_at,
      updated_at,
      _count {
        followedBy,
        following
      }
    `)
    .eq('username', username)
    .single();

  if (error || !user) {
    throw new Error("User not found");
  }

  return user;
};