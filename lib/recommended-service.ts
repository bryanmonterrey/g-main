import { getSupabase } from "@/utils/supabase/getDataWhenAuth";

export const getRecommended = async (session: any) => {
    if (!session) return [];
    
    const supabase = getSupabase(session);
    let userId = session.user?.id;

    console.log('Getting recommended users for:', userId);

    try {
        // Get active users with their avatar URLs
        const { data: activeUsers, error: activeError } = await supabase
            .from('users')
            .select(`
                id,
                username,
                avatar_url,
                wallet_address,
                sessions!inner (
                    expires
                )
            `)
            .neq('id', userId)
            .gt('sessions.expires', new Date().toISOString());

        console.log('Active users query result:', {
            success: !activeError,
            error: activeError,
            usersFound: activeUsers?.length,
            users: activeUsers?.map(u => ({
                id: u.id,
                username: u.username,
                avatar_url: u.avatar_url,
                hasSession: !!u.sessions
            }))
        });

        if (activeError) {
            console.error('Error fetching active users:', activeError);
            return [];
        }

        if (!activeUsers?.length) {
            console.log('No active users found');
            return [];
        }

        // Get following list to exclude
        const { data: followingData, error: followingError } = await supabase
            .from('follow')
            .select('following_id')
            .eq('follower_id', userId);

        const followingIds = followingData?.map(item => item.following_id) || [];

        // Filter out users you're following and ensure each user has required fields
        const recommendedUsers = activeUsers
            .filter(user => !followingIds.includes(user.id))
            .map(user => ({
                id: user.id,
                username: user.username || '',
                avatar_url: user.avatar_url || '',
                wallet_address: user.wallet_address || ''
            }));

        console.log('Final recommended users:', {
            total: activeUsers.length,
            following: followingIds.length,
            recommended: recommendedUsers.length,
            users: recommendedUsers
        });

        return recommendedUsers;

    } catch (error) {
        console.error('Error in getRecommended:', error);
        return [];
    }
};