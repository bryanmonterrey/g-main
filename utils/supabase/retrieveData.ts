import { createClient } from '@supabase/supabase-js';
import { useSession } from 'next-auth/react';
import { type Database } from '@/types/supabase';

export const createSupabaseClient = () => {
  const { data: session } = useSession();
  
  if (!session?.supabaseAccessToken) {
    throw new Error('No access token found');
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${session.supabaseAccessToken}`
        }
      },
      db: {
        schema: 'next_auth'
      }
    }
  );
};

export const getUserData = async () => {
  const { data: session } = useSession();
  
  if (!session?.user?.walletAddress) {
    throw new Error('No authenticated user');
  }

  const supabase = createSupabaseClient();
  
  const { data: userData, error } = await supabase
    .from('users')
    .select('avatar_url')
    .eq('wallet_address', session.user.walletAddress)
    .single();

  if (error) {
    throw error;
  }

  return userData;
};

export const uploadUserAvatar = async (file: File) => {
  const { data: session } = useSession();
  
  if (!session?.user?.walletAddress) {
    throw new Error('No authenticated user');
  }

  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(`${session.user.walletAddress}`, file, {
      upsert: true
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${session.user.walletAddress}`);

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: publicUrl })
    .eq('wallet_address', session.user.walletAddress);

  if (updateError) throw updateError;

  return publicUrl;
};

export const getUserAvatar = async () => {
  const { data: session } = useSession();
  
  if (!session?.user?.walletAddress) {
    throw new Error('No authenticated user');
  }

  const supabase = createSupabaseClient();
  
  const { data: userData, error } = await supabase
    .from('users')
    .select('avatar_url')
    .eq('wallet_address', session.user.walletAddress)
    .single();

  if (error) {
    throw error;
  }

  return userData?.avatar_url;
};