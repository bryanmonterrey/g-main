// components/profile/profile-header.tsx
"use client";

import { UserAvatar } from "@/components/useravatar";
import { shortenWalletAddress } from "@/lib/functions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProfileBanner } from "./profile-banner";
import { getSupabase } from "@/utils/supabase/getDataWhenAuth";
import { useSession } from "next-auth/react";
import { CalendarDays, Heart, MessageCircle, Wallet } from "lucide-react";
import { format } from "date-fns";

interface ProfileHeaderProps {
    username: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    walletAddress: string;
    bio: string | null;
    createdAt: string | null;
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
    bio,
    createdAt,
    isOwnProfile,
    isFollowing,
    onFollow,
    onUnfollow,
}: ProfileHeaderProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentBannerUrl, setCurrentBannerUrl] = useState(bannerUrl);
  const { data: session } = useSession();

  const handleBannerUpdate = async (newBannerUrl: string) => {
    try {
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
      <div className="inline-block max-w-[85ch] min-w-[85ch] px-0 pt-0 bg-zinc-950 rounded-3xl gap-y-4 lg:gap-y-0 items-center justify-center outline outline-zinc-600/15">
        <div className="inline-block w-full">
          <div className="w-full">
            <ProfileBanner
              bannerUrl={currentBannerUrl}
              username={username}
              isOwnProfile={isOwnProfile}
              onBannerUpdate={handleBannerUpdate}
            />
          </div>
          <div className="px-10 py-4">
            <div className="flex flex-col">
              {/* Profile Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-x-7">
                  <div className="relative -mt-12">
                    <UserAvatar 
                      avatarUrl={avatarUrl || ""}
                      username={username || ""}
                      size="xl"
                    />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-lg font-semibold">
                      {username || "Unnamed"}
                    </h2>
                    <p className="text-sm font-semibold text-muted-foreground">
                      @{username || "Unnamed"}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-x-2">
                  {!isOwnProfile ? (
                    <div className="flex items-center gap-x-2">
                      <Button
                        disabled={isLoading}
                        onClick={() => {}}
                        className="h-8 w-8 bg-white/15 text-white hover:bg-white/35 rounded-full transition-all duration-300 ease-in-out"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </Button>
                      <Button
                        disabled={isLoading}
                        onClick={handleFollow}
                        className="h-[34px] px-6 py-2 bg-white/15 hover:bg-white/35 rounded-full transition-all duration-300 ease-in-out"
                      >
                        <Heart className={cn(
                          "h-5 w-5",
                          isFollowing ? "fill-white" : "hidden mx-3"
                        )} />
                        {isFollowing ? <p className="text-sm gradient-text">Following</p> : <p className="text-sm gradient-text">Follow</p>}
                      </Button>
                    </div>
                  ) : (
                    <div className="relative w-full">
                    <div className="w-full absolute inset-0 rounded-full z-5 p-0.5 gradient-border">
                    <Button
                      onClick={() => router.push('/settings')}
                      variant="outline"
                      className="h-[34px] px-6 bg-white/15 text-white hover:bg-white/35 rounded-full border-white/5 transition-all duration-300 ease-in-out"
                    >
                        <p className="text-sm gradient-text">
                            Edit Profile
                        </p>
                    </Button>
                    </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="mt-4">
                {bio && (
                  <p className="text-sm mb-4">{bio}</p>
                )}
                <div className="flex flex-row gap-4 items-center text-muted-foreground">
                  {walletAddress && (
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <p className="text-sm">{shortenWalletAddress(walletAddress)}</p>
                    </div>
                  )}
                  {createdAt && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <p className="text-sm">
                        Joined {format(new Date(createdAt), 'MMMM yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};