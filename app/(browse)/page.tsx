"use client";

import { useEffect } from "react";

import { useTransitionRouter } from 'next-view-transitions'
import Image from "next/image";

import { useSession } from "next-auth/react";

import WalletConnectButton from "@/components/wallet/wallet-connect-button";
import { shortenWalletAddress } from "@/lib/functions";

export default function Home() {
  const { data: session } = useSession();
  console.log("Session data:", session); // Add this
  const router = useTransitionRouter()

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
          <Image
            width={60}
            height={60}
            src={session.user?.image || ""}
            alt="User Image"
            className="rounded-full"
          />
          <p>
            <span className="font-semibold">Logged in as:</span>{" "}
            {shortenWalletAddress(session.user?.name as string)}
          </p>
        </div>
      )}
      <button
        onClick={() => {
          router.push("/protected");
        }}
        className="font-semibold"
      >
        Click to go to Protected Route
      </button>
      <div>
        <div className="flex justify-center items-center h-64 w-64 bg-[url('/bow.svg')] backdrop-blur-lg bg-cover bg-center">
          <div className="h-full w-full background-blur-xl ">

          </div>
        </div>
      </div>
    </main>
  );
}
