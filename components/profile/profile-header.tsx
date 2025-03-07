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
import { ProfileBanner } from "./profile-banner";
import { getSupabase } from "@/utils/supabase/getDataWhenAuth";
import { useSession } from "next-auth/react";
import { Heart, MessageCircle } from "lucide-react";
import { GlowEffect } from "@/components/ui/glow-effect";

interface ProfileHeaderProps {
    username: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    walletAddress: string;
    isOwnProfile: boolean;
    isFollowing: boolean;
    onFollow?: () => Promise<void>;
    onUnfollow?: () => Promise<void>;
  }

export const ProfileHeader = ({
    username,
    avatarUrl,
    bannerUrl,
    walletAddress,
    isOwnProfile,
    isFollowing,
    onFollow,
    onUnfollow,
}: ProfileHeaderProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentBannerUrl, setCurrentBannerUrl] = useState(bannerUrl);

  const handleBannerUpdate = async (newBannerUrl: string) => {
    try {
      const { data: session } = useSession(); // Change this line
      if (!session?.user?.id) return;

      const supabase = getSupabase(session);
      
      const { error } = await supabase
        .from('users')
        .update({ banner_url: newBannerUrl })
        .eq('id', session.user.id);

      if (error) throw error;

      setCurrentBannerUrl(newBannerUrl);
      toast.success("Banner updated successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update banner");
      console.error(error);
    }
  };

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
    <div className="flex items-center justify-center">      
    <div className="inline-block max-w-[85ch] min-w-[85ch] px-0 pt-0 bg-zinc-950 rounded-3xl gap-y-4 lg:gap-y-0 items-center justify-center ">
        <div className="inline-block w-full">
            <div className="w-full">
                <ProfileBanner
                    bannerUrl={currentBannerUrl}
                    username={username}
                    isOwnProfile={isOwnProfile}
                    onBannerUpdate={handleBannerUpdate}
                />
            </div>
            <div className="w-full inline-flex justify-between">
            <div className="inline-flex justify-between w-full">
            <div className="px-10">
                
                <div className="flex items-center gap-x-7">
                    <div className="relative -mt-6">
                    <UserAvatar 
                    avatarUrl={avatarUrl || ""}
                    username={username || ""}
                    size="xl"
                    />
                    </div>
                    <div className="">
                        <div className="flex items-center gap-x-2">
                            <h2 className="text-lg font-semibold">
                                {username || "Unnamed"}
                            </h2>
                        </div>
                        <div className="flex items-center gap-x-2">
                            <p className="text-sm font-semibold text-muted-foreground">
                                @{username || "Unnamed"}
                            </p>
                            </div>
                        </div>
                    </div>
                </div>
            
        </div>
      
      {!isOwnProfile && (
        <div className="flex items-center gap-x-2">
        <div className="inline-flex gap-x-2 px-5 ">
            <div className="inline-flex gap-x-2">
            <div className="relative h-fit w-fit">
        <div className="absolute inset-0 rounded-full z-5 gradient-border">
        <Button
          disabled={isLoading}
          onClick={handleFollow}
          className="h-8 w-8 bg-black text-white hover:bg-zinc-800 rounded-full  border border-white"
        >
          <MessageCircle
          className="h-5 w-5"
          />
        </Button>
        </div>
        </div>
            <div className="relative h-fit w-fit">
        <div className="absolute inset-0 rounded-full z-5 gradient-border">
        <Button
          disabled={isLoading}
          onClick={handleFollow}
          className="h-8 w-8 bg-black text-white hover:bg-zinc-800 rounded-full  border border-white"
        >
          <MessageCircle
          className="h-5 w-5"
          />
        </Button>
        </div>
        </div>
            <div className="relative h-fit w-fit">
        <div className="absolute inset-0 rounded-full z-5 gradient-border">
        <Button
          disabled={isLoading}
          onClick={handleFollow}
          className="h-8 w-8 bg-black text-white hover:bg-zinc-800 rounded-full  border border-white"
        >
          <MessageCircle
          className="h-5 w-5"
          />
        </Button>
        </div>
        </div>
            <div className="relative h-fit w-fit">
        <div className="absolute inset-0 rounded-full z-5 gradient-border">
        <Button
          disabled={isLoading}
          onClick={handleFollow}
          className="h-8 w-8 bg-black text-white hover:bg-zinc-800 rounded-full border border-white"
        >
          <MessageCircle
          className="h-5 w-5"
          />
        </Button>
        </div>
        </div>
            
      <div className="absolute inset-0 rounded-full z-5 gradient-border">
        <Button
          disabled={isLoading}
          onClick={handleFollow}
          className="h-[34px] px-6 bg-black text-white hover:bg-zinc-800 rounded-full border border-white"
        >
          <Heart  
            className={cn(
              "h-5 w-5",
              isFollowing ? "fill-white" : "hidden mx-3"
            )}
          />
          {isFollowing ? "" : "Follow"}
        </Button>
        </div >
        
        </div>
        </div>
        </div>
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