// actions/follow.ts
"use server";

import { revalidatePath } from "next/cache";
import { followUser, unfollowUser } from "@/lib/follow-servicee";

export const onFollow = async (id: string, session: any) => {
  try {
    const followedUser = await followUser(id, session);
    
    // Revalidate both profile pages and any other relevant paths
    revalidatePath("/");    

    // Access username through the joined user data
    if (followedUser?.user?.username) {
      revalidatePath(`/${followedUser.user.username}`);
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
    
    // Revalidate both profile pages and any other relevant paths
    revalidatePath("/");
    if (unfollowedUser?.user?.username) {
      revalidatePath(`/${unfollowedUser.user.username}`);
    }
    
    return unfollowedUser;
  } catch (error) {
    console.error("Unfollow error:", error);
    throw new Error("Failed to unfollow user");
  }
};