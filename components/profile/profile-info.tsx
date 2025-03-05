// components/profile/profile-info.tsx
"use client";

import { CalendarDays, Wallet } from "lucide-react";
import { format } from "date-fns";
import { shortenWalletAddress } from "@/lib/functions";

interface ProfileInfoProps {
  bio: string | null;
  createdAt: string | null;
  walletAddress: string | null;
}

export const ProfileInfo = ({
  bio,
  createdAt,
  walletAddress,
}: ProfileInfoProps) => {
  return (
    <div className="bg-zinc-950 p-4 max-w-[85ch] min-w-[85ch] mx-auto rounded-3xl">
      {/* Bio */}
      {bio && (
        <div className="mb-4">
          <p className="text-sm">{bio}</p>
        </div>
      )}

      {/* Info Grid */}
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
  );
};