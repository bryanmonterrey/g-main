"use client";

import { useEffect } from "react";

import { useRouter } from 'next/navigation'
import Image from "next/image";

import { useSession } from "next-auth/react";
import { Loader } from "@/components/ui/loader";

import WalletConnectButton from "@/components/wallet/wallet-connect-button";
import { shortenWalletAddress } from "@/lib/functions";

export default function Loading() {
  return (
    <main className="flex flex-col w-full h-screen space-y-5 items-center justify-center text-juul z-50">
      <Loader variant="wave" />
    </main>
  );
}
