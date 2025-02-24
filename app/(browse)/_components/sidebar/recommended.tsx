"use client";

import { useSidebar } from '@/store/sidebar';
import React from 'react';
import { UserItem, UserItemSkeleton } from './useritem';
import { Activity } from 'lucide-react';
import Hint from '@/components/hint';
import { Database } from "@/types/supabase";

// Define the user type from your Supabase schema
type DbUser = Database["next_auth"]["Tables"]["users"]["Row"];

// Add the stream property to match your existing interface
interface RecommendedUser extends DbUser {
  stream?: { isLive: boolean } | null;
}

interface RecommendedProps {
  data: RecommendedUser[];
}

const Recommended = ({
  data,
}: RecommendedProps) => {
  const { collapsed } = useSidebar((state) => state);

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
        <Hint label='Trending' placement='right' asChild>
          <div className="flex justify-center items-center mb-2">
            <Activity className='h-4 w-4 text-litepurp' strokeWidth={3.35}/>
          </div>
        </Hint>
      )}
      <div className='flex items-center justify-center w-full'>
        <ul className="px-1 w-full">
          {data.map((user) => (
            <UserItem
              key={user.id}
              username={user.username || ''} // Add null check
              imageUrl={user.avatar_url || ''} // Changed from imageUrl to avatar_url
              isLive={user.stream?.isLive}
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