// recommended-service.ts
import { getSupabase } from "@/utils/supabase/getDataWhenAuth";

export const getRecommended = async (session: any) => {
    if (!session) return [];
    
    const supabase = getSupabase(session);
    let userId = session.user?.id;

    if (userId) {
        // Get users who:
        // 1. Are not the current user
        // 2. Are not followed by the current user
        // 3. Have not blocked the current user
        const { data: users, error } = await supabase
            .from('users')
            .select('*')  // Remove the stream join
            .neq('id', userId)
            .not('id', 'in', (
                supabase
                    .from('follow')
                    .select('following_id')
                    .eq('follower_id', userId)
            ))
            .not('id', 'in', (
                supabase
                    .from('block')
                    .select('blocker_id')
                    .eq('blocked_id', userId)
            ))
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching recommended users:', error);
            return [];
        }

        return users || [];
    } else {
        // For non-authenticated users, just get all users
        const { data: users, error } = await supabase
            .from('users')
            .select('*')  // Remove the stream join
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }

        return users || [];
    }
};