"use client";

import React, { useEffect, useState } from 'react';
import { Wrapper } from './wrapper';
import { useSession } from "next-auth/react";

import { Following, FollowingSkeleton } from './following';
import Recommended, { RecommendedSkeleton } from './recommended';

import { getRecommended } from '@/lib/recommended-service';
import { getFollowedUsers } from '@/lib/follow-service';

const Sidebar = () => {
    const { data: session, status } = useSession();
    const [recommended, setRecommended] = useState([]);
    const [following, setFollowing] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);  // Add error state

    useEffect(() => {
        const fetchData = async () => {
            // Don't fetch if we're not authenticated yet
            if (status === 'loading' || !session) return;

            try {
                setIsLoading(true);
                console.log('Fetching data with session:', {
                    sessionExists: !!session,
                    userId: session?.user?.id
                });

                const [recommendedData, followingData] = await Promise.all([
                    getRecommended(session),
                    getFollowedUsers(session)
                ]);

                console.log('Fetch results:', {
                    recommendedCount: recommendedData?.length,
                    followingCount: followingData?.length
                });
                
                setRecommended(recommendedData || []);
                setFollowing(followingData || []);
            } catch (error) {
                console.error("Error fetching sidebar data:", error);
                setError(error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchData();
    }, [session, status]);

    // Show skeleton while session is loading
    if (status === 'loading' || isLoading) {
        return <SidebarSkeleton />;
    }

    // Show error if any
    if (error) {
        console.error('Sidebar error:', error);
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
        <aside className='fixed left-0 flex flex-col w-[44px] lg:w-[44px] h-full z-10'>
            <FollowingSkeleton />
            <RecommendedSkeleton />
        </aside>
    );
};
