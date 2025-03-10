// lib/follow-service.ts
import { getSupabase } from "@/utils/supabase/getDataWhenAuth";
import type { Database } from '@/types/supabase';
import { useSession } from "next-auth/react";

interface UserData {
    id: string;
    username: string | null;
    avatar_url: string | null;
    wallet_address: string | null;
  }
  
  interface FollowData {
    follower: UserData;
    following: UserData;
  }

export const followUser = async (id: string, session: any) => {
    try {
      if (!session?.user?.id) {
        throw new Error("Unauthorized - No user ID");
      }
  
      const supabase = getSupabase(session);
  
      // Debug log with more info
      console.log("Follow attempt details:", {
        follower: session.user.id,
        following: id,
        hasToken: !!session.supabaseAccessToken,
        tokenStart: session.supabaseAccessToken?.substring(0, 20), // Just log start of token for debugging
      });
  
      // Insert follow relationship
      const { data: follow, error: insertError } = await supabase
        .from('follow')
        .insert({
          follower_id: session.user.id,
          following_id: id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
  
      if (insertError) {
        console.error("Follow insert error details:", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        throw new Error(`Failed to follow user: ${insertError.message}`);
      }
  
      // After successful insert, get the full user details
      const { data: enrichedFollow, error: enrichError } = await supabase
        .from('follow')
        .select(`
          follower:follower_id(id, username, avatar_url, wallet_address),
          following:following_id(id, username, avatar_url, wallet_address)
        `)
        .eq('follower_id', session.user.id)
        .eq('following_id', id)
        .single();
  
      if (enrichError) {
        console.error("Error enriching follow data:", enrichError);
      }
  
      return enrichedFollow || follow;
    } catch (error) {
      console.error("Error in followUser:", error);
      throw error;
    }
  };
  
  
// Update the function with proper type annotations
export const unfollowUser = async (id: string, session: any): Promise<FollowData | null> => {
    try {
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }
  
      const supabase = getSupabase(session);
  
      // Get follow data before deleting
      const { data: follow, error: selectError } = await supabase
        .from('follow')
        .select(`
          follower:follower_id(
            id,
            username,
            avatar_url,
            wallet_address
          ),
          following:following_id(
            id,
            username,
            avatar_url,
            wallet_address
          )
        `)
        .eq('follower_id', session.user.id)
        .eq('following_id', id)
        .single();
  
      if (selectError) {
        console.error("Unfollow select error:", selectError);
        throw new Error("Failed to fetch follow data");
      }
  
      // Delete the follow
      const { error: deleteError } = await supabase
        .from('follow')
        .delete()
        .eq('follower_id', session.user.id)
        .eq('following_id', id);
  
      if (deleteError) {
        console.error("Unfollow delete error:", deleteError);
        throw new Error("Failed to unfollow user");
      }
  
      return follow;
    } catch (error) {
      console.error("Error in unfollowUser:", error);
      throw error;
    }
  };
  
  export const isFollowingUser = async (id: string, session: any): Promise<boolean> => {
    try {
      if (!session?.user?.id) {
        return false;
      }
  
      const supabase = getSupabase(session);
  
      const { data, error } = await supabase
        .from('follow')
        .select()
        .eq('follower_id', session.user.id)
        .eq('following_id', id)
        .maybeSingle();
  
      if (error) {
        console.error("Follow check error:", error);
        return false;
      }
  
      return !!data;
    } catch (error) {
      console.error("Error in isFollowingUser:", error);
      return false;
    }
  };

export const getFollowedUsers = async () => {
  try {
    const session = await useSession();
    if (!session?.data?.user?.id) {
      return [];
    }

    const supabase = getSupabase(session);

    const { data: followedUsers, error } = await supabase
      .from('follow')
      .select(`
        following:following_id(
          id,
          username,
          avatar_url,
          bio,
          wallet_address
        )
      `)
      .eq('follower_id', session.data.user.id);

    if (error) throw error;
    return followedUsers.map(fu => fu.following);
  } catch (error) {
    console.error("Error in getFollowedUsers:", error);
    return [];
  }
};