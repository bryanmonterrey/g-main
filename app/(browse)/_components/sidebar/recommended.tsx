"use client";

import { useSidebar } from '@/store/sidebar';
import React from 'react';
import { UserItem, UserItemSkeleton } from './useritem';
import { HandCoins } from 'lucide-react';
import { Database } from "@/types/supabase";
import { useSession } from "next-auth/react";
import { GlowEffect } from '@/components/ui/glow-effect';

// Define the user type from your Supabase schema
type DbUser = Database["next_auth"]["Tables"]["users"]["Row"];

// Simplified interface without stream property
interface RecommendedUser extends DbUser {
  // Add any additional properties you need here
}

interface RecommendedProps {
  data: RecommendedUser[];
}

const Recommended = ({
  data,
}: RecommendedProps) => {
  const { collapsed } = useSidebar((state) => state);
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  console.log('Recommended render:', {
    dataLength: data?.length,
    isAuthenticated,
    collapsed
  });

  // Show nothing only if explicitly empty
  if (!Array.isArray(data)) {
    console.log('Invalid data type for recommended users');
    return null;
  }

  const showLabel = !collapsed && data.length > 0;


  return (
    <div>
      {showLabel && (
        <div className="flex w-full justify-start mr-auto items-start pl-3 mb-3">
          <p className="w-full flex justify-start items-start text-sm font-medium text-litewhite">
            trending
          </p>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center items-center mb-2">
          <div className='relative'>
          <GlowEffect
        colors={['#00FFA2', '#00FFA2', '#00FFA2', '#00FFA2']}
        mode='static'
        blur='soft'
        className="absolute inset-0 rounded-full z-5"
      />
          <div className='h-2 w-2 bg-[#00FFA2] rounded-full'>

          </div>
          </div>
        </div>
      )}
      <div className='flex items-center justify-center w-full'>
        <ul className="px-1 w-full">
          {data.map((user) => (
            <UserItem
              key={user.id}
              username={user.username || ''} 
              avatarUrl={user.avatar_url || ''} 
              isAuthenticated={isAuthenticated} // Replace isLive with isAuthenticated
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Recommended;

export const RecommendedSkeleton = () => {
  return (
    <ul className='space-y-0 pl-0.5'>
      {[...Array(11)].map((_, i) => (
        <UserItemSkeleton key={i} />
      ))}
    </ul>
  );
};