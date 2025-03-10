// lib/follow-service.ts
import { getSupabase } from "@/utils/supabase/getDataWhenAuth";
import type { Database } from '@/types/supabase';
import { useSession } from "next-auth/react";

export const followUser = async (id: string, session: any) => {
    try {
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }
  
      const supabase = getSupabase(session);
  
      console.log("Follow attempt:", {
        follower: session.user.id,
        following: id,
        token: !!session.supabaseAccessToken
      });
  
      // Check if trying to follow self
      if (id === session.user.id) {
        throw new Error("Cannot follow yourself");
      }
  
      // Check if already following
      const { data: existingFollow, error: checkError } = await supabase
        .from('follow')
        .select()
        .eq('follower_id', session.user.id)
        .eq('following_id', id)
        .maybeSingle();
  
      if (checkError) {
        console.error("Follow check error:", checkError);
        throw new Error("Failed to check follow status");
      }
  
      if (existingFollow) {
        throw new Error("Already following");
      }
  
      // Generate a unique ID for both schemas
      const followId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
  
      // Insert into follow table (removed 'public.' prefix)
      const { data: follow, error: insertError } = await supabase
        .from('follow')
        .insert({
          id: followId,
          follower_id: session.user.id,
          following_id: id,
          created_at: timestamp,
          updated_at: timestamp
        })
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
        .single();
  
      if (insertError) {
        console.error("Follow insert error:", insertError);
        throw new Error("Failed to follow user");
      }
  
      return follow;
    } catch (error) {
      console.error("Error in followUser:", error);
      throw error;
    }
  };
  
  export const unfollowUser = async (id: string, session: any) => {
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
  
  export const isFollowingUser = async (id: string, session: any) => {
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