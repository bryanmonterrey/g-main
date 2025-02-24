'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import WalletContextProvider from '../contexts/WalletContextProvider';

interface ClientWalletProviderProps {
  children: React.ReactNode;
}

export default function ClientWalletProvider({ children }: ClientWalletProviderProps) {
  const { data: session } = useSession();

  return (
    
      <WalletContextProvider>
        {children}
      </WalletContextProvider>
    
  );
}