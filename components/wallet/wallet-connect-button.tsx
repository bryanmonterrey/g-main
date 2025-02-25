"use client";

import { useEffect, useState } from "react";

import { getCsrfToken, signIn, signOut, useSession } from "next-auth/react";
import bs58 from "bs58";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { DrawerDemo } from "./walletDrawer";
import { DoorOpen } from 'lucide-react';

import { SigninMessage } from "@/utils/SigninMessage";
import { shortenWalletAddress } from "@/lib/functions";
import { getSelf } from "@/lib/auth-service";
import { getSupabase } from "@/utils/supabase/getDataWhenAuth";


export default function WalletConnectButton() {
  const { publicKey, connecting, connected, disconnecting, signMessage, disconnect} =
    useWallet(); // hook up connecting, disconnecting, signMessage later look at wallet-coonect-button other project solami
  const walletModal = useWalletModal();
  const { status, data: session, update } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  // Add state for user data
  const [userData, setUserData] = useState({
    username: '',
    avatar_url: ''
  });

  const handleConnectClick = () => {
    // Show the wallet modal when the connect button is clicked
    walletModal.setVisible(true);
  };


  const handleSignIn = async () => {
    if (isSigningIn || status === "loading") return;
    setIsSigningIn(true);
    try {
      if (!connected) {
        walletModal.setVisible(true);
        return;
      }

      if (session && status === "authenticated") {
        return;
      }

      const csrfToken = await getCsrfToken();
      if (!publicKey || !csrfToken || !signMessage) {
        console.error("Wallet is not ready for signing");
        return;
      }

      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: publicKey.toBase58(),
        statement:
          "Welcome to Solana! By signing, you're confirming ownership of the wallet you're connecting. This is a secure, gas-free process that ensures your identity without granting Solana any permission to perform transactions or access your funds. Your security and privacy are always our priority.",
        nonce: csrfToken,
        uri: "https://solana.com/",
        version: "1",
        chainId: "devnet",
        issuedAt: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      });

      const encodedMessage = new TextEncoder().encode(message.prepare());
      const signature = await signMessage(encodedMessage);
      const serializedSignature = bs58.encode(signature);

      const result = await signIn("credentials", {
        message: JSON.stringify(message),
        signature: serializedSignature,
        redirect: false,
      });

      if (result?.error) {
        console.error("Sign-in failed:", result.error);
      } else {
        await update();
        console.log("Sign in successful!", {
          session: session,
          wallet: publicKey?.toString()
        });
      }
    } catch (error) {
      console.error("Error during sign-in:", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleWalletDisconnect = async () => {
    if (session && status === "authenticated") {
      try {
        setIsSigningOut(true);
        
        // First sign out from Next-Auth
        await signOut({ redirect: false });
        
        // Then disconnect the wallet
        if (disconnect) {
          await disconnect();
        }
        
        console.log("User signed out successfully");
      } catch (error) {
        console.error("Error during sign-out process:", error);
      } finally {
        setIsSigningOut(false);
      }
    }
  };

  useEffect(() => {
    // Only attempt auto sign-in if not actively signing out
    if (connected && status === "unauthenticated" && !isSigningIn && !isSigningOut) {
      handleSignIn();
    }
    
    // Only handle disconnection if not actively signing out (to avoid loops)
    if (!connected && status === "authenticated" && !isSigningOut) {
      handleWalletDisconnect();
    }
  }, [connected, status, isSigningIn, isSigningOut]);


  // Function to determine button class based on connection state
  const getButtonClass = () => {
    if (connecting) return "bg-yellow-500 hover:bg-yellow-600 text-white rounded-full"; // Connecting state
    if (disconnecting) return "bg-orange-500 hover:bg-orange-600 text-white rounded-full"; // Disconnecting state
    if (connected) return "bg-azul/15 hover:bg-azul/35 text-azul rounded-full"; // Connected state
    return "bg-purple-600 hover:bg-purple-700 text-white rounded-full"; // Disconnected state
  };

  // Function to get button text based on connection state
  const getButtonText = () => {
    if (status === "loading") return "Loading...";
    if (isSigningIn) return "Signing...";
    if (isSigningOut) return "Signing Out...";
    if (connecting) return "Connecting...";
    if (disconnecting) return "Disconnecting...";
    if (connected && publicKey) return shortenWalletAddress(publicKey.toString());
    return "Connect Wallet";
  };

  return (
    <div className="relative inline-flex gap-x-4">
      
    <button
        onClick={!connected ? handleConnectClick : () => {}}
        disabled={connecting || disconnecting}
        className={`px-5 border border-zinc-950 py-2 font-semibold transition-all duration-300 ease-in-out text-xs ${getButtonClass()} ${(connecting || disconnecting) ? 'opacity-80 cursor-not-allowed' : ''}`}
      >
        <span className="flex items-center">
          {(connecting || disconnecting) && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {getButtonText()}
        </span>
      </button>
    {session && (
      <div className="flex items-center">
        <DoorOpen className="w-6 h-6 text-white" />
        <DrawerDemo 
        username={session.user.name || ''}
        avatarUrl={session.user.image || '/default.png'} 
        className="flex items-center relative"
        onSignOut={handleWalletDisconnect}
      />
      </div>
      )}
    </div>
  );
}
