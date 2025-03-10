"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import { useSession } from 'next-auth/react';
import { Search } from 'lucide-react';

interface NavItemsProps {
    session: any;
  }

export const NavItems: React.FC<NavItemsProps> = ({
  session
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const { data: sessionData } = useSession();

  // Show loading state while checking session
  if (!sessionData) {
    return <div className='bg-buttongray animate-pulse w-36 h-2 rounded-full'></div>;
  }

  const navigationItems = [
    {
      key: 'chat',
      label: 'chat',
      path: '/chat',
      icon: null, // Add your icon component here if needed
      public: false // Protected route that requires auth
    },
    {
      key: 'browse',
      label: 'browse',
      path: '/browse',
      icon: null, // Add your icon component here if needed
      public: true // Public route that doesn't require auth
    },
    {
        key: 'agent',
        label: 'agent',
        path: '/agent',
        icon: null, // Add your icon component here if needed
        public: false // Protected route that requires auth
      },
      {
        key: 'tasks',
        label: 'tasks',
        path: '/tasks',
        icon: null, // Add your icon component here if needed
        public: false // Protected route that requires auth
      },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <>
      {navigationItems.map((item) => (
        // Show the item if it's public OR if the user is authenticated
        (item.public || sessionData) && (
          <Button
            key={item.key}
            className={cn(
              'bg-transparent shadow-none hover:bg-transparent transition-all ease-in-out duration-200',
              pathname === item.path ? 'text-white/95 active:text-white hover:text-white' : 'text-white/75 hover:text-white'
            )}
            onClick={() => handleNavigation(item.path)}
          >
            <div className="h-full flex items-center justify-center gap-1 transition-all ease-in-out duration-200 font-semibold text-sm active:text-white">
              {item.icon}
              <p>{item.label}</p>
            </div>
          </Button>
        )
      ))}
      <Button className='rounded-full bg-white/5 p-2 px-2.5 shadow-none hover:bg-white/5 transition-all ease-in-out duration-300'>
        <Search className='w-4 h-4 text-white/75 hover:text-white' strokeWidth={2.50} />
      </Button>
    </>
  );
};