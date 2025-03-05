"use client";

import { useEffect } from "react";

import { useRouter } from 'next/navigation'
import Image from "next/image";

import { useSession } from "next-auth/react";

import WalletConnectButton from "@/components/wallet/wallet-connect-button";
import { shortenWalletAddress } from "@/lib/functions";

export default function Home() {
  const { data: session } = useSession();
  console.log("Session data:", session); // Add this
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push("/chat");
    }
  }, [session, router]);

  return (
    <main className="flex flex-col w-full h-screen space-y-5 items-center justify-center z-50">
      <WalletConnectButton />
      {!session && (
        <>
          <span>You are not signed in</span>
        </>
      )}
      {session && (
        <div className="flex flex-col items-center space-y-2">
          <p>
            <span className="font-semibold">Logged in as:</span>{" "}
            {shortenWalletAddress(session.user?.name as string)}
          </p>
        </div>
      )}
      <div>
        
      </div>
    </main>
  );
}
