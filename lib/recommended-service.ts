// recommended-service.ts
import { getSupabase } from "@/utils/supabase/getDataWhenAuth";

export const getRecommended = async (session: any) => {
    if (!session) return [];
    
    const supabase = getSupabase(session);
    let userId = session.user?.id;

    if (!userId) {
        try {
            // For non-authenticated users, just get recent users
            const { data, error } = await supabase
                .from('users')  // Using public schema
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);
                
            if (error) {
                console.error('Error fetching users:', error);
                return [];
            }
            
            return data || [];
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }
    
    try {
        // Step 1: Get the IDs of users the current user is following
        const { data: followingData, error: followingError } = await supabase
            .from('follow')  // Now using public.follow
            .select('following_id')
            .eq('follower_id', userId);
            
        if (followingError) {
            console.error('Error fetching following IDs:', followingError);
            return [];
        }
        
        // Step 2: Get IDs of users who have blocked the current user
        const { data: blockersData, error: blockersError } = await supabase
            .from('block')  // Now using public.block
            .select('blocker_id')
            .eq('blocked_id', userId);
            
        if (blockersError) {
            console.error('Error fetching blocker IDs:', blockersError);
            return [];
        }
        
        // Extract IDs into arrays
        const followingIds = followingData?.map(item => item.following_id) || [];
        const blockerIds = blockersData?.map(item => item.blocker_id) || [];
        
        // Build the main query
        let query = supabase
            .from('users')  // Using public schema
            .select('*')
            .neq('id', userId)
            .order('created_at', { ascending: false })
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
        
        return users || [];
    } catch (error) {
        console.error('Error in getRecommended:', error);
        return [];
    }
};