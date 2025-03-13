"use client";

import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/useravatar";

interface UserSearchItemProps {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  walletAddress: string | null;
  onSelect: () => void;
}

export function UserSearchItem({
  id,
  username,
  avatarUrl,
  walletAddress,
  onSelect
}: UserSearchItemProps) {
  const router = useRouter();
  
  // Format wallet address for display
  const formatWalletAddress = (address: string | null) => {
    if (!address) return null;
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div 
      onClick={onSelect}
      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors"
    >
      <div className="flex-shrink-0">
        <UserAvatar
          avatarUrl={avatarUrl || ""}
          username={username || ""}
          size="default"
        />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-white font-medium truncate">
          {username || "Unnamed User"}
        </span>
        {walletAddress && (
          <span className="text-xs text-zinc-400 truncate">
            {formatWalletAddress(walletAddress)}
          </span>
        )}
      </div>
    </div>
  );
}