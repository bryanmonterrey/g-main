"use client";

import { useSidebar } from "@/store/sidebar";
import { UserItem, UserItemSkeleton } from "./useritem";
import { Heart } from 'lucide-react';
import { Database } from "@/types/supabase";
import { useSession } from "next-auth/react";
import { GlowEffect } from "@/components/ui/glow-effect";

// Define types based on your Supabase schema
type DbFollow = Database['next_auth']['Tables']['follow']['Row'];
type DbUser = Database['next_auth']['Tables']['users']['Row'];

// Removed stream property and added optional isAuthenticated field
interface FollowWithUser extends DbFollow {
  following: DbUser & {
    isAuthenticated?: boolean;
  };
}

interface FollowingProps {
  data: FollowWithUser[];
}

export const Following = ({
  data,
}: FollowingProps) => {
  const { collapsed } = useSidebar((state) => state);
  const { status } = useSession();
  const isUserAuthenticated = status === 'authenticated';

  if (!data.length) {
    return null;
  }

  return (
    <div>
      {!collapsed && (
        <div className="pl-3 mb-3">
          <p className="text-sm font-semibold text-litewhite">
            following
          </p>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center items-center pt-[2px] mb-2">
          <div className='relative'>
          <GlowEffect
        colors={['#FFC6C6', '#ADFFE1', '#B8A4FF', '#E6B1FF']}
        mode='static'
        blur='soft'
        className="absolute inset-0 rounded-full z-5"
      />
          <div className='h-2 w-2 gradient-border rounded-full'>

          </div>
          </div>
        </div>
      )}
      <div className='flex items-center justify-center w-full'>
        <ul className="w-full px-1">
          {data.map((follow) => (
            <UserItem 
              key={follow.following.id}
              username={follow.following.username || ''}
              avatarUrl={follow.following.avatar_url || ''} 
              isAuthenticated={follow.following.isAuthenticated} // Use the current user's auth status
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export const FollowingSkeleton = () => {
  return (
    <ul className="pl-0.5 pt-2 lg:pt-0">
      {[...Array(3)].map((_, i) => (
        <UserItemSkeleton key={i} />
      ))}
    </ul>
  );
};