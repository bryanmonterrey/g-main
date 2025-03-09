// components/profile/index.tsx
"use client";

import { useRouter } from "next/navigation";
import { ProfileHeader } from "./profile-header";
import { ProfileInfo } from "./profile-info";
import { ProfilePosts } from "./profile-posts";
import { shortenWalletAddress } from "@/lib/functions";
import { onFollow, onUnfollow } from "@/actions/follow";
import { toast } from "sonner";
import { useState } from "react";

interface ProfileProps {
  user: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    banner_url: string | null;
    wallet_address: string | null;
    bio: string | null;
    created_at: string | null;
    updated_at: string | null;
  };
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollow?: () => Promise<void>;
  onUnfollow?: () => Promise<void>;
}

export const Profile = ({
  user,
  isOwnProfile,
  isFollowing: initialIsFollowing,
  onFollow,
  onUnfollow
}: ProfileProps) => {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    try {
      setIsLoading(true);
      if (!user.id) return;

      if (isFollowing) {
        if (onUnfollow) {
          await onUnfollow();
        } else {
          await onUnfollow(user.id);
        }
        toast.success(`Unfollowed ${user.username || 'user'}`);
        setIsFollowing(false);
      } else {
        if (onFollow) {
          await onFollow();
        } else {
          await onFollow(user.id);
        }
        toast.success(`Following ${user.username || 'user'}`);
        setIsFollowing(true);
      }
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] overflow-y-auto">
      {/* Main Profile Layout */}
      <div className="flex flex-col gap-y-2 mt-6">
        {/* Profile Header Section */}
        <ProfileHeader
            username={user.username}
            avatarUrl={user.avatar_url}
            bannerUrl={user.banner_url}
            walletAddress={user.wallet_address || ''}
            bio={user.bio}
            createdAt={user.created_at}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onFollow={onFollow || handleFollow}
            onUnfollow={onUnfollow || handleFollow}
        />

        {/* Profile Info Section */}
        

        {/* Profile Posts Section */}
        <ProfilePosts
          userId={user.id}
          username={user.username}
          isOwnProfile={isOwnProfile}
        />
      </div>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="flex flex-col gap-y-4">
      {/* Add your skeleton loaders here */}
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
      </div>
    </div>
  );
};

export default Profile;