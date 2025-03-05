// components/profile/profile-header.tsx
"use client";

import { UserAvatar } from "@/components/useravatar";
import { shortenWalletAddress } from "@/lib/functions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  username: string | null;
  avatarUrl: string | null;
  walletAddress: string;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollow?: () => Promise<void>;
  onUnfollow?: () => Promise<void>;
}

export const ProfileHeader = ({
  username,
  avatarUrl,
  walletAddress,
  isOwnProfile,
  isFollowing,
  onFollow,
  onUnfollow,
}: ProfileHeaderProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    try {
      setIsLoading(true);
      if (isFollowing) {
        await onUnfollow?.();
        toast.success(`Unfollowed ${username}`);
      } else {
        await onFollow?.();
        toast.success(`Following ${username}`);
      }
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-center">
    <div className="flex max-w-[85ch] min-w-[85ch] p-5 bg-zinc-950 rounded-3xl gap-y-4 lg:gap-y-0 items-start justify-between px-10">
      <div className="flex items-center gap-x-7">
        <UserAvatar 
          avatarUrl={avatarUrl || ""}
          username={username || ""}
          size="lg"
        />
        <div className="space-y-1">
          <div className="flex items-center gap-x-2">
            <h2 className="text-lg font-semibold">
              {username || "Unnamed"}
            </h2>
          </div>
          <p className="text-sm font-semibold text-muted-foreground">
            {shortenWalletAddress(walletAddress)}
          </p>
        </div>
      </div>
      
      {!isOwnProfile && (
        <Button
          disabled={isLoading}
          onClick={handleFollow}
          className="h-[34px] px-6 bg-black text-white hover:bg-zinc-800 rounded-full"
        >
          <Image 
            src="/broken.svg" 
            width={20} 
            height={20} 
            alt="heart" 
            className={cn(
              "h-5 w-5",
              isFollowing ? "fill-white" : "hidden mx-3"
            )}
          />
          {isFollowing ? "" : "Follow"}
        </Button>
      )}
      
      {isOwnProfile && (
        <Button
          onClick={() => router.push('/settings')}
          variant="outline"
          className="h-[34px] px-6 bg-black text-white hover:bg-zinc-800 rounded-full"
        >
          Edit Profile
        </Button>
      )}
    </div>
    </div>
  );
};

export const ProfileHeaderSkeleton = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-y-4 lg:gap-y-0 items-start justify-between px-4">
      {/* Add your skeleton loading state here */}
    </div>
  );
};