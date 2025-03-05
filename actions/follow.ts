// actions/follow.ts
"use server";

import { revalidatePath } from "next/cache";
import { followUser, unfollowUser } from "@/lib/follow-servicee";

export const onFollow = async (id: string) => {
  try {
    const followedUser = await followUser(id);
    
    // Revalidate both profile pages and any other relevant paths
    revalidatePath("/");    

    if (followedUser?.following?.username) {
        
      revalidatePath(`/${followedUser.following.username}`);
    }
    
    return followedUser;
  } catch (error) {
    console.error("Follow error:", error);
    throw new Error("Failed to follow user");
  }
};

export const onUnfollow = async (id: string) => {
  try {
    const unfollowedUser = await unfollowUser(id);
    
    // Revalidate both profile pages and any other relevant paths
    revalidatePath("/");
    if (unfollowedUser?.following?.username) {
      revalidatePath(`/${unfollowedUser.following.username}`);
    }
    
    return unfollowedUser;
  } catch (error) {
    console.error("Unfollow error:", error);
    throw new Error("Failed to unfollow user");
  }
};