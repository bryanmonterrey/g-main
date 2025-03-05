// lib/follow-service.ts
import { getSupabase } from "@/utils/supabase/getDataWhenAuth";
import { getSession } from "next-auth/react";

export const isFollowingUser = async (id: string) => {
  try {
    const session = await getSession();
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
      console.error("Error checking follow status:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error in isFollowingUser:", error);
    return false;
  }
};

export const followUser = async (id: string) => {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const supabase = getSupabase(session);

    // Check if trying to follow self
    if (id === session.user.id) {
      throw new Error("Cannot follow yourself");
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follow')
      .select()
      .eq('follower_id', session.user.id)
      .eq('following_id', id)
      .maybeSingle();

    if (existingFollow) {
      throw new Error("Already following");
    }

    // Create follow relationship
    const { data: follow, error } = await supabase
      .from('follow')
      .insert({
        follower_id: session.user.id,
        following_id: id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        follower:follower_id(
          id,
          username,
          avatar_url
        ),
        following:following_id(
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return follow;
  } catch (error) {
    console.error("Error in followUser:", error);
    throw error;
  }
};

export const unfollowUser = async (id: string) => {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const supabase = getSupabase(session);

    // Get the follow relationship before deleting
    const { data: follow } = await supabase
      .from('follow')
      .select(`
        follower:follower_id(
          id,
          username,
          avatar_url
        ),
        following:following_id(
          id,
          username,
          avatar_url
        )
      `)
      .eq('follower_id', session.user.id)
      .eq('following_id', id)
      .single();

    // Delete the follow relationship
    const { error } = await supabase
      .from('follow')
      .delete()
      .eq('follower_id', session.user.id)
      .eq('following_id', id);

    if (error) throw error;
    return follow;
  } catch (error) {
    console.error("Error in unfollowUser:", error);
    throw error;
  }
};

export const getFollowedUsers = async () => {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
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
      .eq('follower_id', session.user.id);

    if (error) throw error;
    return followedUsers.map(fu => fu.following);
  } catch (error) {
    console.error("Error in getFollowedUsers:", error);
    return [];
  }
};