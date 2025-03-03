"use client";

import { useSession } from "next-auth/react";
import { usePathname } from 'next/navigation';
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";

export const Navigation = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const walletAddress = session?.user?.walletAddress || "";

  if (!session) {
    return <div></div>; // Or a more sophisticated loading state
  }

  if (!session || !walletAddress) {
    return null; // Or handle the case when there's no user
  }

  const navItems = [
    { label: "stream", href: `/dashboard/${walletAddress}` },
    { label: "profile", href: `/dashboard/${walletAddress}/profile` },
    { label: "messages", href: `/dashboard/${walletAddress}/messages` },
    { label: "vods", href: `/dashboard/${walletAddress}/vods` },
    { label: "community", href: `/dashboard/${walletAddress}/community` },
    { label: "subscriptions", href: `/dashboard/${walletAddress}/subscriptions` },
    { label: "settings", href: `/dashboard/${walletAddress}/settings` },
  ];

  return (
    <div className='gap-x-3 inline-flex items-center justify-center'>
      {navItems.map((item) => (
        <Button 
          key={item.href}
          className={cn(
            'bg-transparent hover:bg-transparent',
            pathname === item.href ? 'text-white/85' : 'text-white/85 hover:text-white'
          )}
        >
          <Link 
            href={item.href} 
            className={cn(
              'h-full flex items-center justify-center',
              'hover:transition-all hover:ease-in-out hover:duration-300',
              'font-semibold text-sm',
              'active:text-white active:duration-300 active:transition-all    active:ease-in-out',
              pathname === item.href && 'text-white'
            )}
          >
            <p>{item.label}</p>
          </Link>
        </Button>
      ))}
    </div>
  );
};