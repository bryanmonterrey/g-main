// actions/follow.ts
"use server";

import { revalidatePath } from "next/cache";
import { followUser, unfollowUser } from "@/lib/follow-servicee";

export const onFollow = async (id: string, session: any) => {
  try {
    const followedUser = await followUser(id, session);
    
    // Revalidate home path
    revalidatePath("/");    

    // We need to check what structure was returned
    // If it has enriched data (with nested objects), use that
    if ('following' in followedUser && followedUser.following && 'username' in followedUser.following) {
      revalidatePath(`/${followedUser.following.username}`);
    } 
    // If it's the raw database row, we'd need to fetch the username separately
    // or simply revalidate all profile pages
    else {
      // This will revalidate the specific profile page if we know the username
      // Otherwise, you could add logic to fetch the username using the following_id
      revalidatePath(`/[username]`); // This is a catch-all approach
    }
    
    return followedUser;
  } catch (error) {
    console.error("Follow error:", error);
    throw new Error("Failed to follow user");
  }
};

export const onUnfollow = async (id: string, session: any) => {
  try {
    const unfollowedUser = await unfollowUser(id, session);
    
    // Revalidate home path
    revalidatePath("/");
    
    // Use same logic as in onFollow
    if ('following' in unfollowedUser && unfollowedUser.following && 'username' in unfollowedUser.following) {
      revalidatePath(`/${unfollowedUser.following.username}`);
    } else {
      revalidatePath(`/[username]`); // Catch-all approach
    }
    
    return unfollowedUser;
  } catch (error) {
    console.error("Unfollow error:", error);
    throw new Error("Failed to unfollow user");
  }
};