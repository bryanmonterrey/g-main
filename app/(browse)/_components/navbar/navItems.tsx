"use client";

import React from 'react';
import { useTransitionRouter } from 'next-view-transitions';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Hash, Compass, Users } from 'lucide-react';
import PopoverWithHint from '@/components/popoverWithHint';
import { cn } from "@/lib/utils";
import { useSession } from 'next-auth/react';

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
  className?: string;
}

interface PopoverItem {
  key: string;
  label: string;
  url: string;
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | string;
}

interface NavItemsProps {
    session: any;
    popoverItems: PopoverItem[];
    handlePopoverItemSelect: (key: string) => void;
  }

export const NavItems: React.FC<NavItemsProps> = ({
  session,
  popoverItems,
  handlePopoverItemSelect
}) => {
  const pathname = usePathname();
  const router = useTransitionRouter();

  const { data: sessionData } = useSession();

  // Show loading state while checking session
  if (!sessionData) {
    return <div className='bg-buttongray animate-pulse w-36 h-2 rounded-full'></div>;
  }

  const navigationItems = [
    {
      key: 'browse',
      label: 'Browse',
      path: '/browse',
      icon: null, // Add your icon component here if needed
      public: true // Public route that doesn't require auth
    },
    {
      key: 'chat',
      label: 'Chat',
      path: '/chat',
      icon: null, // Add your icon component here if needed
      public: false // Protected route that requires auth
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
        // Only show non-public items if we have a wallet address
        (item.public || session?.user?.walletAddress) && (
          <Button
            key={item.key}
            className={cn(
              'bg-transparent shadow-none hover:bg-transparent transition-all ease-in-out duration-300',
              pathname === item.path ? 'text-leaf' : 'text-white/80 hover:text-white'
            )}
            onClick={() => handleNavigation(item.path)}
          >
            <div className="h-full flex items-center justify-center gap-2 hover:transition-colors hover:ease-in-out hover:duration-300 font-medium text-sm active:text-white hover:text-white active:duration-100">
              {item.icon}
              <p>{item.label}</p>
            </div>
          </Button>
        )
      ))}

      <PopoverWithHint
        triggerContent={
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white active:text-white flex items-center justify-center hover:transition-all hover:ease-in-out hover:duration-300 h-6 w-6 active:scale-95 focus-visible:text-white"
          >
            <Hash className="text-inherit h-4 w-4 min-h-4 min-w-4 m-auto" strokeWidth={3} />
          </Button>
        }
        popoverContent={
          <div className="p-4">
            <p>Menu</p>
          </div>
        }
        items={popoverItems}
        openLabel="Menu"
        openHintPlacement="bottom-start"
        placement="bottom"
        showArrow={true}
        onItemSelect={handlePopoverItemSelect}
      />
    </>
  );
};