// recommended-service.ts
import { getSupabase } from "@/utils/supabase/getDataWhenAuth";

export const getRecommended = async (session: any) => {
    if (!session) return [];
    
    const supabase = getSupabase(session);
    let userId = session.user?.id;

    // Define what we consider as "online" - within last 5 minutes
    const onlineThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    if (!userId) {
        try {
            // For non-authenticated users, get only online recent users
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .gt('last_signed_in', onlineThreshold) // Only get online users
                .order('last_signed_in', { ascending: false })
                .limit(10);
                
            if (error) {
                console.log('Online threshold being used:', onlineThreshold);
                console.error('Error fetching users:', error);
                return [];
            }
            
            console.log('Found online users:', data?.length || 0);
            return data || [];
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }
    
    try {
        // Step 1: Get the IDs of users the current user is following
        const { data: followingData, error: followingError } = await supabase
            .from('follow')
            .select('following_id')
            .eq('follower_id', userId);
            
        if (followingError) {
            console.error('Error fetching following IDs:', followingError);
            return [];
        }
        
        // Step 2: Get IDs of users who have blocked the current user
        const { data: blockersData, error: blockersError } = await supabase
            .from('block')
            .select('blocker_id')
            .eq('blocked_id', userId);
            
        if (blockersError) {
            console.error('Error fetching blocker IDs:', blockersError);
            return [];
        }
        
        // Extract IDs into arrays
        const followingIds = followingData?.map(item => item.following_id) || [];
        const blockerIds = blockersData?.map(item => item.blocker_id) || [];
        
        // Build the main query for online users only
        let query = supabase
            .from('users')
            .select('*')
            .neq('id', userId)
            .gt('last_signed_in', onlineThreshold) // Only get online users
            .order('last_signed_in', { ascending: false }) // Order by most recently active
            .limit(10);
            
        // Apply filters only if we have IDs to filter with
        if (followingIds.length > 0) {
            query = query.not('id', 'in', followingIds);
        }
        
        if (blockerIds.length > 0) {
            query = query.not('id', 'in', blockerIds);
        }
        
        const { data: users, error } = await query;
        
        if (error) {
            console.error('Error fetching recommended users:', error);
            return [];
        }

        console.log('Found online recommended users:', users?.length || 0);
        console.log('Current time:', new Date().toISOString());
        console.log('Online threshold:', onlineThreshold);
        
        return users || [];
    } catch (error) {
        console.error('Error in getRecommended:', error);
        return [];
    }
};