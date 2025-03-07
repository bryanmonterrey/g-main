// app/(browse)/[username]/profile-client.tsx
"use client";

import { Profile } from "@/components/profile";
import { getUserByUsername } from "@/lib/auth-service.server";
import { isFollowingUser } from "@/lib/follow-servicee";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { onFollow, onUnfollow } from "@/actions/follow";

interface ProfileClientProps {
  username: string; // Changed from initialProfile to username
}

const ProfileClient = ({ username }: ProfileClientProps) => {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await getUserByUsername(username, session);
        setProfile(userProfile);
        
        if (session?.user?.id && userProfile.id) {
          const following = await isFollowingUser(userProfile.id);
          setIsFollowing(following);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [username, session]);

  const handleFollow = async (): Promise<void> => {
    try {
      await onFollow(profile.id);
      setIsFollowing(true);
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleUnfollow = async (): Promise<void> => {
    try {
      await onUnfollow(profile.id);
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

  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">User not found</div>
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === profile.id;

  return (
    <Profile
      user={profile}
      isOwnProfile={isOwnProfile}
      isFollowing={isFollowing}
      onFollow={handleFollow}
      onUnfollow={handleUnfollow}
    />
  );
};

export default ProfileClient;