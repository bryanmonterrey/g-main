// components/profile/profile-banner.tsx
"use client";

import { UploadButton } from "@/components/upload-button";
import Image from "next/image";
import { CameraIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileBannerProps {
  bannerUrl: string | null;
  username: string | null;
  isOwnProfile: boolean;
  onBannerUpdate?: (url: string) => void;
}

export const ProfileBanner = ({
  bannerUrl,
  username,
  isOwnProfile,
  onBannerUpdate,
}: ProfileBannerProps) => {
  return (
    <div className="relative w-full h-36 rounded-t-3xl">
      {bannerUrl ? (
        <Image
          src={bannerUrl}
          alt={`${username}'s banner`}
          fill
          className="object-cover rounded-t-3xl"
        />
      ) : (
        <div className="w-full h-full bg-zinc-800/10 rounded-t-3xl" />
      )}

      {isOwnProfile && (
        <div className="absolute inset-0 flex items-center justify-center rounded-t-3xl">
          <UploadButton
            className="h-full w-full bg-transparent rounded-t-3xl"
            endpoint="bannerImage"
            onClientUploadComplete={(res) => {
              if (res?.[0]?.url && onBannerUpdate) {
                onBannerUpdate(res[0].url);
              }
            }}
            onUploadError={(error: Error) => {
              console.error("Error uploading:", error);
            }}
          >
            <Button 
              variant="ghost" 
              className="bg-black/20 h-full w-full inset-0 hover:bg-black/30 rounded-t-3xl"
            >
              <CameraIcon className="h-10 w-10 text-white/80"/>
            </Button>
          </UploadButton>
        </div>
      )}
    </div>
  );
};