"use client"

import * as React from "react"
import { UserAvatar } from "@/components/useravatar"
import { getSelf } from "@/lib/auth-service";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Button } from "@/components/ui/button"
import { Drawer } from 'vaul';
import { Power, Wallet } from "lucide-react";

interface DrawerDemoProps {
  username: string;
  avatarUrl: string;
  walletAddress?: string; 
  className?: string;
  onSignOut: () => Promise<void>;
  onRefresh?: () => void;
}

const data = [
  {
    goal: 400,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 239,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 349,
  },
]

const snapPoints = ['148px', '355px', 1];

export function DrawerDemo({ username, avatarUrl, walletAddress, className, onSignOut, onRefresh }: DrawerDemoProps) {
  const [goal, setGoal] = React.useState(350)
  const [loading, setLoading] = React.useState(true)
  const [snap, setSnap] = React.useState<number | string | null>(snapPoints[0]);
  const [balance, setBalance] = React.useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = React.useState(false);
  const { connection } = useConnection();

  function onClick(adjustment: number) {
    setGoal(Math.max(200, Math.min(400, goal + adjustment)))
  }

  // Function to handle refresh click
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  // Function to fetch wallet balance
  const fetchWalletBalance = React.useCallback(async () => {
    if (!walletAddress || !connection) return;
    
    try {
      setIsLoadingBalance(true);
      const publicKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / LAMPORTS_PER_SOL); // Convert lamports to SOL
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [walletAddress, connection]);

  // Fetch balance when component mounts or wallet address changes
  React.useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance]);


  return (
    <Drawer.Root direction="right">
      <Drawer.Trigger className="flex items-center justify-center">
        <Button className="bg-transparent">
        <UserAvatar 
            username={username} 
            avatarUrl={avatarUrl} 
            size="default"
          />
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-custom z-20" />
        <Drawer.Content
          className="right-2 top-2 bottom-2 fixed z-[1050] outline-none max-w-[369px] flex"
          // The gap between the edge of the screen and the drawer is 8px in this case.
          style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}
        >
          <div className="bg-zinc-950/95 border border-zinc-50/5 backdrop-blur-custom  h-full w-full grow p-5 flex flex-col rounded-[16px]">
            <div className="max-w-md">
            <Drawer.Title className="font-semibold mb-4 text-white flex justify-between items-center">
              <div className="inline-flex items-center justify-between gap-2">
              <UserAvatar 
                    username={username} 
                    avatarUrl={avatarUrl} 
                    size="default"
                  />
                  <span className="text-white font-semibold text-sm">
                    {typeof username === 'string' && username.length > 0 
                      ? username 
                      : "No username"}
                  </span>
                  </div>
                <button
                  onClick={onSignOut}
                  className="px-2 py-2 rounded-full bg-zinc-900/95 hover:bg-red-500/35 hover:text-red-500 text-zinc-500/90 font-semibold transition-all duration-300 ease-in-out border border-zinc-500/5"
                >
                  <Power className="w-4 h-4" strokeWidth={3}/>
                </button>
              </Drawer.Title>
              <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-zinc-400" />
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-400">Balance</span>
                    <span className="text-white font-semibold">
                      {isLoadingBalance ? (
                        <span className="text-sm text-zinc-400">Loading...</span>
                      ) : balance !== null ? (
                        <span className="text-sm">{balance.toFixed(4)} SOL</span>
                      ) : (
                        <span className="text-sm text-zinc-400">Unavailable</span>
                      )}
                    </span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="ml-auto rounded-full p-2 h-auto bg-zinc-800 hover:bg-zinc-700"
                  onClick={handleRefresh}
                  disabled={isLoadingBalance}
                >
                  <svg className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </div>
                
              </div>
              <Drawer.Description className="text-zinc-600 mb-2">
                Manage your wallet and account settings here.
              </Drawer.Description>
            </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
