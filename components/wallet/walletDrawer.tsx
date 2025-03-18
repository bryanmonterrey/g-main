"use client"

import * as React from "react"
import { UserAvatar } from "@/components/useravatar"
import { getSelf } from "@/lib/auth-service";

import { Button } from "@/components/ui/button"
import { Drawer } from 'vaul';
import { Power } from "lucide-react";

interface DrawerDemoProps {
  username: string;
  avatarUrl: string;
  className?: string;
  onSignOut: () => Promise<void>;
  onRefresh?: () => void;
}

const data = [
  {
    goal: 400,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 239,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 349,
  },
]

const snapPoints = ['148px', '355px', 1];

export function DrawerDemo({ username, avatarUrl, className, onSignOut, onRefresh }: DrawerDemoProps) {
  const [goal, setGoal] = React.useState(350)
  
  const [loading, setLoading] = React.useState(true)

  const [snap, setSnap] = React.useState<number | string | null>(snapPoints[0]);

  function onClick(adjustment: number) {
    setGoal(Math.max(200, Math.min(400, goal + adjustment)))
  }

  // Function to handle refresh click
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <Drawer.Root direction="right">
      <Drawer.Trigger className="flex items-center justify-center">
        <Button className="bg-transparent">
        <UserAvatar 
            username={username} 
            avatarUrl={avatarUrl} 
            size="default"
          />
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-custom z-20" />
        <Drawer.Content
          className="right-2 top-2 bottom-2 fixed z-[1050] outline-none max-w-[369px] flex"
          // The gap between the edge of the screen and the drawer is 8px in this case.
          style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}
        >
          <div className="bg-zinc-950/95 border border-zinc-50/5 backdrop-blur-custom  h-full w-full grow p-5 flex flex-col rounded-[16px]">
            <div className="max-w-md mx-auto">
            <Drawer.Title className="font-semibold mb-4 text-white flex justify-between items-center">
              <div className="inline-flex items-center gap-2">
              <UserAvatar 
                    username={username} 
                    avatarUrl={avatarUrl} 
                    size="default"
                  />
                  <span className="text-white font-semibold text-sm">{username}</span>
                  </div>
                <button
                  onClick={onSignOut}
                  className="px-2 py-2 rounded-full bg-zinc-900/95 hover:bg-red-500/35 hover:text-red-500 text-zinc-500/90 font-semibold transition-all duration-300 ease-in-out border border-zinc-500/5"
                >
                  <Power className="w-4 h-4" strokeWidth={3}/>
                </button>
              </Drawer.Title>
              <div className="flex items-center gap-4 mb-4">
                
                
              </div>
              <Drawer.Description className="text-zinc-600 mb-2">
                Manage your wallet and account settings here.
              </Drawer.Description>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
