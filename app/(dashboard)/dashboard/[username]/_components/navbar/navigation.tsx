"use client";

import { useSession } from "next-auth/react";
import { usePathname } from 'next/navigation';
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";

export const Navigation = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const username = session?.user?.username || "";

  if (!session) {
    return <div>Loading...</div>; // Or a more sophisticated loading state
  }

  if (!session || !username) {
    return null; // Or handle the case when there's no user
  }

  const navItems = [
    { label: "Stream", href: `/dashboard/${username}` },
    { label: "Profile", href: `/dashboard/${username}/profile` },
    { label: "Messages", href: `/dashboard/${username}/messages` },
    { label: "Vods", href: `/dashboard/${username}/vods` },
    { label: "Community", href: `/dashboard/${username}/community` },
    { label: "Subscriptions", href: `/dashboard/${username}/subscriptions` },
    { label: "Settings", href: `/dashboard/${username}/settings` },
  ];

  return (
    <div className='gap-x-7 inline-flex items-center justify-center'>
      {navItems.map((item) => (
        <Button 
          key={item.href}
          className={cn(
            'bg-transparent hover:bg-transparent',
            pathname === item.href ? 'text-white' : 'text-white/80 hover:text-white'
          )}
        >
          <Link 
            href={item.href} 
            className={cn(
              'h-full flex items-center justify-center',
              'hover:transition-all hover:ease-in-out hover:duration-300',
              'font-medium text-[15px]',
              'active:text-white hover:text-white active:scale-95 active:duration-100 active:transition-none',
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