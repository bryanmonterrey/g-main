'use client';

import { SessionProvider } from 'next-auth/react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => 
    process.env.NEXT_PUBLIC_HELIUS_RPC_URL!, 
    []
  );

  const wallets = useMemo(
    () => [new PhantomWalletAdapter()],
    []
  );

  return (
    <SessionProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SessionProvider>
  );
}