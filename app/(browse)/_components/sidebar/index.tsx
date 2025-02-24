import React from 'react';
import { Wrapper } from './wrapper';

import { Following, FollowingSkeleton } from './following';
import Recommended, { RecommendedSkeleton } from './recommended';


import { getRecommended } from '@/lib/recommended-service';
import { getFollowedUsers } from '@/lib/follow-service';

const Sidebar = async () => {
    const recommended = await getRecommended();
    const following = await getFollowedUsers();

  return (
    <Wrapper>
        <div className='flex justify-end'>
             
        </div>

        <div className='space-y-3 pt-2 mt-2'>
            <Following data={following} />
            <Recommended data={recommended} />
        </div>
    </Wrapper>
  )
}

export default Sidebar

export const SidebarSkeleton = () => {
    return (
        <aside className='fixed left-0 flex flex-col w-[44px] lg:w-[44px] h-full z-50'>
            <FollowingSkeleton />
            <RecommendedSkeleton />
        </aside>
    );
};
