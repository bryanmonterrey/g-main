"use client";

import { useSidebar } from "@/store/sidebar";
import { UserItem, UserItemSkeleton } from "./useritem";
import { Heart } from 'lucide-react';
import Hint from "@/components/hint";
import { Database } from "@/types/supabase";

// Define types based on your Supabase schema
type DbFollow = Database['next_auth']['Tables']['follow']['Row'];
type DbUser = Database['next_auth']['Tables']['users']['Row'];

interface FollowWithUser extends DbFollow {
  following: DbUser & {
    stream?: {
      is_live: boolean;
    } | null;
  };
}

interface FollowingProps {
  data: FollowWithUser[];
}

export const Following = ({
  data,
}: FollowingProps) => {
  const { collapsed } = useSidebar((state) => state);

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
        <Hint label='Following' placement='right' asChild>
          <div className="flex justify-center items-center pt-[2px] mb-2">
            <Heart className="h-[18px] w-[18px] text-litepurp" strokeWidth={3}/>
          </div>
        </Hint>
      )}
      <div className='flex items-center justify-center w-full'>
        <ul className="w-full px-1">
          {data.map((follow) => (
            <UserItem 
              key={follow.following.id}
              username={follow.following.username || ''}
              imageUrl={follow.following.avatar_url || ''} 
              isLive={follow.following.stream?.is_live} // Updated to use is_live
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