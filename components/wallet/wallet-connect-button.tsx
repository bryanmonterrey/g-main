"use client";

import { useEffect, useState } from "react";

import { getCsrfToken, signIn, signOut, useSession } from "next-auth/react";
import bs58 from "bs58";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { DrawerDemo } from "./walletDrawer";

import { SigninMessage } from "@/utils/SigninMessage";
import { shortenWalletAddress } from "@/lib/functions";
import { getSelf } from "@/lib/auth-service";
import { getSupabase } from "@/utils/supabase/getDataWhenAuth";


export default function WalletConnectButton() {
  const { publicKey, connecting, connected, disconnecting, signMessage} =
    useWallet(); // hook up connecting, disconnecting, signMessage later look at wallet-coonect-button other project solami
  const walletModal = useWalletModal();
  const { status, data: session, update } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  // Add state for user data
  const [userData, setUserData] = useState({
    username: '',
    avatar_url: ''
  });


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
      await signOut({ redirect: false });
    }
  };

  useEffect(() => {
    if (connected && status === "unauthenticated" && !isSigningIn) {
      handleSignIn();
    }
    if (!connected && status === "authenticated") {
      handleWalletDisconnect();
    }
  }, [connected, status, isSigningIn]);

  console.log("Current session:", session);
  console.log("Wallet connected:", connected);
  console.log("Public key:", publicKey?.toString());

  const getButtonText = () => {
    if (status === "loading" || isSigningIn) return "Connecting...";
    if (!publicKey) return "connect";
    return shortenWalletAddress(publicKey.toString());
  };

  return (
    <div className="relative ">
    <WalletMultiButton>
    
    </WalletMultiButton>
    {session?.user?.image && (
        <DrawerDemo 
          username={session.user.name || ''} 
          avatarUrl={session.user.image}
          className="flex items-center relative"
        />
      )}

    </div>
  );
}
