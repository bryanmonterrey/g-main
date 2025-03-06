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
    <div className="relative w-full h-36">
      {bannerUrl ? (
        <Image
          src={bannerUrl}
          alt={`${username}'s banner`}
          fill
          className="object-cover rounded-xl"
        />
      ) : (
        <div className="w-full h-full bg-zinc-800/10 rounded-t-3xl" />
      )}

      {isOwnProfile && (
        <div className="absolute bottom-4 right-4">
          <UploadButton
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
              variant="secondary" 
              className="bg-background/60 backdrop-blur-sm hover:bg-background/80"
            >
              <CameraIcon className="h-4 w-4 mr-2" />
              Change Banner
            </Button>
          </UploadButton>
        </div>
      )}
    </div>
  );
};