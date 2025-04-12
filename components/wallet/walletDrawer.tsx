"use client"

import * as React from "react"
import { UserAvatar } from "@/components/useravatar"
import { getSelf } from "@/lib/auth-service";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Button } from "@/components/ui/button"
import { Drawer } from 'vaul';
import { ArrowUpRight, CreditCard, Power, Wallet } from "lucide-react";

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
  const [usdBalance, setUsdBalance] = React.useState<number | null>(null);
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

   // Function to fetch SOL price in USD
   const fetchSolPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const data = await response.json();
      return data.solana.usd;
    } catch (error) {
      console.error("Error fetching SOL price:", error);
      return null;
    }
  };

  // Function to fetch wallet balance
  const fetchWalletBalance = React.useCallback(async () => {
    if (!walletAddress || !connection) return;
    
    try {
      setIsLoadingBalance(true);
      const publicKey = new PublicKey(walletAddress);
      const balanceInLamports = await connection.getBalance(publicKey);
      const solBalance = balanceInLamports / LAMPORTS_PER_SOL;
      setBalance(solBalance);
      
      // Get SOL price in USD
      const solPrice = await fetchSolPrice();
      if (solPrice) {
        setUsdBalance(solBalance * solPrice);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(null);
      setUsdBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [walletAddress, connection]);

  // Fetch balance when component mounts or wallet address changes
  React.useEffect(() => {
    fetchWalletBalance();
    
    // Set up an interval to refresh the balance every 60 seconds
    const intervalId = setInterval(() => {
      fetchWalletBalance();
    }, 60000); // 60 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchWalletBalance]);

  const moonpayUrl = `https://www.moonpay.com/buy/sol`;


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
          <div className="bg-zinc-950/95 border border-zinc-50/5 backdrop-blur-custom h-full w-full grow p-5 flex flex-col rounded-[16px]">
            <div className="max-w-md mx-auto">
            <Drawer.Title className="font-semibold mb-4 text-white flex justify-between items-center">
              <div className="inline-flex items-center gap-2">
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
                  <div className="flex flex-col">
                    {isLoadingBalance ? (
                      <span className="text-sm  text-zinc-400">Loading...</span>
                    ) : (
                      <div className="flex flex-col">
                        {usdBalance !== null ? (
                          <span className="text-4xl font-bold text-lucky">
                            ${usdBalance.toFixed(2)} USD
                          </span>
                        ) : (
                          <span className="text-sm text-zinc-400">Unavailable</span>
                        )}
                        {balance !== null && (
                          <span className="text-xs text-zinc-500">
                            {balance.toFixed(4)} SOL
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <a 
                  href={moonpayUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-br from-purple-700/20 to-purple-600/10 hover:from-purple-700/30 hover:to-purple-600/20 border border-purple-500/20 transition-all duration-300"
                >
                  <div className="w-7 h-7 rounded-full bg-purple-600/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-white">Buy SOL</span>
                </a>
                
                <a 
                  href={`https://explorer.solana.com/address/${walletAddress}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-br from-blue-700/20 to-blue-600/10 hover:from-blue-700/30 hover:to-blue-600/20 border border-blue-500/20 transition-all duration-300"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-white">Explorer</span>
                </a>
              </div>
              <Drawer.Description className="text-zinc-600 mb-2">
                Manage your wallet and account settings here.
              </Drawer.Description>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
