"use client";

import { useEffect } from "react";

import { useRouter } from 'next/navigation'
import Image from "next/image";

import { useSession } from "next-auth/react";

import WalletConnectButton from "@/components/wallet/wallet-connect-button";
import { shortenWalletAddress } from "@/lib/functions";

export default function Loading() {
  return (
    <main className="flex flex-col w-full h-screen space-y-5 items-center justify-center z-50">
      hi
    </main>
  );
}
