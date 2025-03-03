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
      label: 'Chat',
      path: '/chat',
      icon: null, // Add your icon component here if needed
      public: false // Protected route that requires auth
    },
    {
      key: 'browse',
      label: 'Browse',
      path: '/browse',
      icon: null, // Add your icon component here if needed
      public: true // Public route that doesn't require auth
    },
    {
        key: 'agent',
        label: 'Agent',
        path: '/agent',
        icon: null, // Add your icon component here if needed
        public: false // Protected route that requires auth
      },
      {
        key: 'tasks',
        label: 'Tasks',
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
              'bg-transparent shadow-none hover:bg-transparent transition-all ease-in-out duration-300',
              pathname === item.path ? 'text-juul/85 active:text-juul hover:text-juul' : 'text-white/85 hover:text-white'
            )}
            onClick={() => handleNavigation(item.path)}
          >
            <div className="h-full flex items-center justify-center gap-1 transition-all ease-in-out duration-300 font-semibold text-sm active:text-juul">
              {item.icon}
              <p>{item.label}</p>
            </div>
          </Button>
        )
      ))}
      <Button className='bg-transparent shadow-none hover:bg-transparent transition-all ease-in-out duration-300 '>
        <Search className='w-4 h-4' strokeWidth={2.25} />
      </Button>
    </>
  );
};