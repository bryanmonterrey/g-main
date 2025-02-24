"use client";

import { useSession } from "next-auth/react";

export const useCurrentUser = () => {
  const { data: session } = useSession();
  return session?.user;
};
// Add other client-side auth functions here if needed

// You might also want to add a hook for the wallet address specifically
export const useWalletAddress = () => {
  const { data: session } = useSession();
  return session?.user?.walletAddress;
};

// Optional: Add a hook to check if user is authenticated
export const useIsAuthenticated = () => {
  const { data: session } = useSession();
  return !!session?.user?.walletAddress;
};