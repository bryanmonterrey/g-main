// app/(browse)/[username]/profile-client.tsx
"use client";

import { Profile } from "@/components/profile";
import { isFollowingUser } from "@/lib/follow-servicee";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { onFollow, onUnfollow } from "@/actions/follow";

interface ProfileClientProps {
  initialProfile: any; // Type this properly based on your user type
}

export const ProfileClient = ({ initialProfile }: ProfileClientProps) => {
  const { data: session, status } = useSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (session?.user?.id && initialProfile.id) {
        try {
          setIsLoading(true);
          const following = await isFollowingUser(initialProfile.id);
          setIsFollowing(following);
        } catch (error) {
          console.error("Error checking follow status:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkFollowStatus();
  }, [session, initialProfile.id]);

  const handleFollow = async (): Promise<void> => {
    try {
      await onFollow(initialProfile.id);
      setIsFollowing(true);
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleUnfollow = async (): Promise<void> => {
    try {
      await onUnfollow(initialProfile.id);
      setIsFollowing(false);
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === initialProfile.id;

  return (
    <Profile
      user={initialProfile}
      isOwnProfile={isOwnProfile}
      isFollowing={isFollowing}
      onFollow={handleFollow}
      onUnfollow={handleUnfollow}
    />
  );
};