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
}

export const Profile = ({
  user,
  isOwnProfile,
  isFollowing: initialIsFollowing
}: ProfileProps) => {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    try {
      setIsLoading(true);
      if (!user.id) return;

      if (isFollowing) {
        await onUnfollow(user.id);
        toast.success(`Unfollowed ${user.username || 'user'}`);
        setIsFollowing(false);
      } else {
        await onFollow(user.id);
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

  const handleUnfollow = async () => {
    try {
      setIsLoading(true);
      if (!user.id) return;

      await onUnfollow(user.id);
  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] overflow-y-auto">
      {/* Main Profile Layout */}
      <div className="flex flex-col gap-y-4">
        {/* Profile Header Section */}
        <ProfileHeader
            username={user.username}
            avatarUrl={user.avatar_url}
            bannerUrl={user.banner_url}
            walletAddress={user.wallet_address || ''}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
            />

        {/* Profile Info Section */}
        <ProfileInfo
          bio={user.bio}
          createdAt={user.created_at}
          walletAddress={user.wallet_address}
        />

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