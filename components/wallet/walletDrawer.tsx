"use client"

import * as React from "react"
import { UserAvatar } from "@/components/useravatar"
import { getSelf } from "@/lib/auth-service";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Button } from "@/components/ui/button"
import { Drawer } from 'vaul';
import { ArrowUpRight, CreditCard, Power, Wallet, Image, Coins, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Token {
  mint: string;
  symbol: string;
  name: string;
  icon?: string;
  balance: number;
  usdValue?: number;
  decimals: number;
}

interface NFT {
  mint: string;
  name: string;
  image: string;
  collection?: string;
}

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

// Define the tab categories similar to your chat component
const TABS = [
  { id: "tokens", name: "Tokens", icon: Coins },
  { id: "nfts", name: "NFTs", icon: Image },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function DrawerDemo({ username, avatarUrl, walletAddress, className, onSignOut, onRefresh }: DrawerDemoProps) {
  const [goal, setGoal] = React.useState(350)
  const [loading, setLoading] = React.useState(true)
  const [snap, setSnap] = React.useState<number | string | null>(snapPoints[0]);
  const [balance, setBalance] = React.useState<number | null>(null);
  const [usdBalance, setUsdBalance] = React.useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = React.useState(false);
  const [tokens, setTokens] = React.useState<Token[]>([]);
  const [nfts, setNfts] = React.useState<NFT[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = React.useState(false);
  const [isLoadingNfts, setIsLoadingNfts] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabId>("tokens");
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

  // Function to fetch tokens using Jupiter API
  const fetchTokens = React.useCallback(async () => {
    if (!walletAddress || !connection) return;
    
    setIsLoadingTokens(true);
    try {
      // Use the Jupiter API to fetch token balances
      const response = await fetch(`https://quote-api.jup.ag/v6/user-balances?walletAddress=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch token balances');
      }
      
      const data = await response.json();
      
      // Format the token data from Jupiter API response
      if (data && data.tokens) {
        const formattedTokens: Token[] = data.tokens.map((token: any) => ({
          mint: token.mint,
          symbol: token.symbol || "Unknown",
          name: token.name || "Unknown Token",
          icon: token.logoURI,
          balance: token.uiBalance || 0,
          usdValue: token.usdValue || undefined,
          decimals: token.decimals || 0
        }));
        
        setTokens(formattedTokens);
      } else {
        setTokens([]);
      }
    } catch (error) {
      console.error("Error fetching tokens:", error);
      setTokens([]);
    } finally {
      setIsLoadingTokens(false);
    }
  }, [walletAddress, connection]);

  // Function to fetch NFTs using Helius API
  const fetchNfts = React.useCallback(async () => {
    if (!walletAddress) return;
    
    setIsLoadingNfts(true);
    try {
      // Using the Helius API from environment variables
      const response = await fetch(
        `https://mainnet.helius-rpc.com/?api-key=89acb127-21f1-48fd-a752-77abb2a7fd78`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'my-id',
            method: 'getAssetsByOwner',
            params: {
              ownerAddress: walletAddress,
              page: 1,
              limit: 10, // Limit to 10 NFTs for better performance
            },
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch NFTs');
      }
      
      const data = await response.json();
      
      if (data.result && data.result.items) {
        const formattedNfts: NFT[] = data.result.items.map((nft: any) => ({
          mint: nft.id,
          name: nft.content.metadata.name || 'Unnamed NFT',
          image: nft.content.files?.[0]?.uri || '',
          collection: nft.content.metadata.collection?.name,
        }));
        
        setNfts(formattedNfts);
      } else {
        setNfts([]);
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      setNfts([]);
    } finally {
      setIsLoadingNfts(false);
    }
  }, [walletAddress]);

  // Handle tab change
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    
    // Load data for the selected tab if it hasn't been loaded yet
    if (tabId === "tokens" && tokens.length === 0 && !isLoadingTokens) {
      fetchTokens();
    } else if (tabId === "nfts" && nfts.length === 0 && !isLoadingNfts) {
      fetchNfts();
    }
  };

  // Fetch balance when component mounts or wallet address changes
  React.useEffect(() => {
    fetchWalletBalance();
    
    // Set up an interval to refresh the balance every 60 seconds
    const balanceInterval = setInterval(() => {
      fetchWalletBalance();
    }, 60000); // 60 seconds
    
    // Initial load of tokens
    fetchTokens();
    
    return () => clearInterval(balanceInterval);
  }, [fetchWalletBalance, fetchTokens]);

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
              
              {/* Balance Display - Exact match to original UI */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    {isLoadingBalance ? (
                      <span className="text-sm text-zinc-400">Loading...</span>
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
              
              {/* Action Buttons - Exact match to original UI */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <a 
                  href={moonpayUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-2 p-2 rounded-xl bg-gradient-to-br from-purple-700/20 to-purple-600/10 hover:from-purple-700/30 hover:to-purple-600/20 border border-purple-500/20 transition-all duration-300 ease-in-out"
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
                  className="flex flex-col items-center justify-center gap-2 p-2 rounded-xl bg-gradient-to-br from-blue-700/20 to-blue-600/10 hover:from-blue-700/30 hover:to-blue-600/20 border border-blue-500/20 transition-all duration-300 ease-in-out"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-white">Explorer</span>
                </a>
              </div>
              
              {/* Tabs for Tokens and NFTs - Using your Framer Motion style */}
              <div className="flex gap-2 flex-wrap relative mb-4">
                {TABS.map((tab, index) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "py-1.5 px-3 text-sm font-semibold rounded-full transition-all relative z-10 flex items-center gap-1.5",
                        activeTab === tab.id
                          ? "text-white/80" // Light text for contrast against background
                          : "text-azul/70 hover:text-white hover:bg-zinc-900/65"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.name}
                      
                      {/* Animated pill background */}
                      {activeTab === tab.id && (
                        <motion.div 
                          layoutId="walletTabHighlight"
                          className="absolute inset-0 bg-azul/15 text-white rounded-full -z-10"
                          initial={false}
                          transition={{ 
                            type: "spring", 
                            stiffness: 250, 
                            damping: 30 
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Content area between tabs and bottom description */}
              {activeTab === "tokens" && (
                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2 mb-4">
                  {isLoadingTokens ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                    </div>
                  ) : tokens.length > 0 ? (
                    tokens.map((token) => (
                      <div 
                        key={token.mint} 
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/30"
                      >
                        <div className="flex items-center gap-2">
                          {token.icon ? (
                            <img 
                              src={token.icon} 
                              alt={token.symbol} 
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/200x200/363636/FFFFFF?text=Token";
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-zinc-400">
                                {token.symbol?.slice(0, 2) || '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">{token.symbol}</p>
                            <p className="text-xs text-zinc-400">{token.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">
                            {token.balance.toLocaleString(undefined, { 
                              maximumFractionDigits: 4 
                            })}
                          </p>
                          {token.usdValue !== undefined && (
                            <p className="text-xs text-zinc-400">
                              ${token.usdValue.toLocaleString(undefined, { 
                                maximumFractionDigits: 2 
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                      <Coins className="w-10 h-10 text-zinc-700 mb-2" />
                      <p className="text-zinc-400 text-sm">No tokens found in this wallet</p>
                      <button
                        onClick={fetchTokens}
                        className="mt-3 text-xs text-blue-400 hover:text-blue-300"
                      >
                        Refresh
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === "nfts" && (
                <div className="max-h-[300px] overflow-y-auto pr-1 mb-4">
                  {isLoadingNfts ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                    </div>
                  ) : nfts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {nfts.map((nft) => (
                        <div 
                          key={nft.mint} 
                          className="flex flex-col rounded-xl overflow-hidden bg-zinc-900/30 border border-zinc-800/30"
                        >
                          <div className="relative aspect-square w-full">
                            {nft.image ? (
                              <img 
                                src={nft.image} 
                                alt={nft.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://placehold.co/200x200/363636/FFFFFF?text=NFT";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                <Image className="w-10 h-10 text-zinc-600" />
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium text-white truncate">
                              {nft.name}
                            </p>
                            {nft.collection && (
                              <p className="text-xs text-zinc-400 truncate">
                                {nft.collection}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                      <Image className="w-10 h-10 text-zinc-700 mb-2" />
                      <p className="text-zinc-400 text-sm">No NFTs found in this wallet</p>
                      <button
                        onClick={fetchNfts}
                        className="mt-3 text-xs text-blue-400 hover:text-blue-300"
                      >
                        Refresh
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Description - Exact match to original UI */}
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