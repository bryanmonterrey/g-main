import { getSupabase } from "@/utils/supabase/getDataWhenAuth";

export const getRecommended = async (session: any) => {
    if (!session) {
        console.log('No session provided to getRecommended');
        return [];
    }
    
    const supabase = getSupabase(session);
    let userId = session.user?.id;

    try {
        // Get all online users through active sessions
        const { data: onlineUsers, error: onlineError } = await supabase
            .from('users')
            .select(`
                *,
                sessions!inner(
                    expires
                )
            `)
            .neq('id', userId)
            .gt('sessions.expires', new Date().toISOString())
            .limit(10);

        if (onlineError) {
            console.error('Error fetching online users:', onlineError);
            return [];
        }

        console.log('Found online users:', {
            count: onlineUsers?.length,
            users: onlineUsers?.map(u => ({
                id: u.id,
                username: u.username,
                sessionExpiry: u.sessions?.expires
            }))
        });

        // Get following list to exclude
        const { data: followingData, error: followingError } = await supabase
            .from('follow')
            .select('following_id')
            .eq('follower_id', userId);
            
        if (followingError) {
            console.error('Error fetching following IDs:', followingError);
            return [];
        }

        const followingIds = followingData?.map(item => item.following_id) || [];

        // Filter out users you're following
        let recommendedUsers = onlineUsers;
        if (followingIds.length > 0) {
            recommendedUsers = onlineUsers.filter(user => !followingIds.includes(user.id));
        }

        console.log('Final recommended users:', {
            count: recommendedUsers.length,
            users: recommendedUsers.map(u => ({
                id: u.id,
                username: u.username
            }))
        });

        return recommendedUsers;

    } catch (error) {
        console.error('Error in getRecommended:', error);
        return [];
    }
};