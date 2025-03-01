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

// Rename to getSelfByWalletAddress
export const getSelfByWalletAddress = async (walletAddress: string, session: any) => {
  console.log("getSelfByWalletAddress called with:", { walletAddress, sessionUserId: session?.user?.id, sessionWalletAddress: session?.user?.walletAddress });
  
  if (!session?.user?.id) {
    console.error("Unauthorized: session user id is missing");
    throw new Error("Unauthorized");
  }

  const supabase = getSupabase(session);
  
  try {
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
      .eq('wallet_address', walletAddress)
      .single();

    console.log("Supabase query result:", { user, error });

    if (error) {
      console.error("Supabase error:", error);
      throw new Error("User not found");
    }

    if (!user) {
      console.error("User not found for wallet address:", walletAddress);
      throw new Error("User not found");
    }

    // Since we're checking by wallet address, this check is simpler
    if (session.user.walletAddress !== walletAddress) {
      console.error("Authorization failed - Session wallet address doesn't match requested wallet address", 
        { sessionWalletAddress: session.user.walletAddress, requestedWalletAddress: walletAddress });
      throw new Error("Unauthorized");
    }

    return user;
  } catch (error) {
    console.error("Error in getSelfByWalletAddress:", error);
    throw error;
  }
};