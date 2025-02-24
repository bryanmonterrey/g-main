"use client";

import React, { useEffect, useState } from 'react';
import { Wrapper } from './wrapper';
import { useSession } from "next-auth/react";

import { Following, FollowingSkeleton } from './following';
import Recommended, { RecommendedSkeleton } from './recommended';

import { getRecommended } from '@/lib/recommended-service';
import { getFollowedUsers } from '@/lib/follow-service';

const Sidebar = () => {
    const { data: session } = useSession();
    const [recommended, setRecommended] = useState([]);
    const [following, setFollowing] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [recommendedData, followingData] = await Promise.all([
                    getRecommended(session),
                    getFollowedUsers()
                ]);
                
                setRecommended(recommendedData);
                setFollowing(followingData);
            } catch (error) {
                console.error("Error fetching sidebar data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchData();
    }, [session]);

    if (isLoading) {
        return <SidebarSkeleton />;
    }

    return (
        <Wrapper>
            <div className='flex justify-end'></div>
            <div className='space-y-3 pt-2 mt-2'>
                <Following data={following} />
                <Recommended data={recommended} />
            </div>
        </Wrapper>
    );
}

export default Sidebar;

export const SidebarSkeleton = () => {
    return (
        <aside className='fixed left-0 flex flex-col w-[44px] lg:w-[44px] h-full z-50'>
            <FollowingSkeleton />
            <RecommendedSkeleton />
        </aside>
    );
};
