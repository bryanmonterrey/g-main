import { getSupabase } from "@/utils/supabase/getDataWhenAuth";
import { getSelf } from "@/lib/auth-service";

export const getFollowedUsers = async (session: any) => {
    try {
        console.log('getFollowedUsers called with session:', session); // Add this

        if (!session) {
            console.log('No session provided to getFollowedUsers'); // Add this
            return [];
        }
        
        const self = await getSelf(session);
        console.log('Got self user:', self); // Add this
        const supabase = getSupabase(session);

        const { data: followedUsers, error } = await supabase
            .from('follow') // Now using public.follow
            .select(`
                id,
                following:users!follow_following_id_fkey (
                    id,
                    username,
                    avatar_url,
                    wallet_address,
                    last_signed_in   
                )
            `)
            .eq('follower_id', self.id);

        if (error) {
            console.error('Error fetching followed users:', error);
            throw error;
        }
        
        return followedUsers || [];
    } catch (error) {
        console.error('Error in getFollowedUsers:', error);
        return [];
    }
}

export const isFollowingUser = async (id: string, session: any) => {
    try {
        if (!session) return false;
        
        const self = await getSelf(session);
        const supabase = getSupabase(session);

        // Check if user exists
        const { data: otherUser, error: userError } = await supabase
            .from('users') // Using public.users
            .select()
            .eq('id', id)
            .single();

        if (userError || !otherUser) {
            console.error('User not found:', userError);
            throw new Error("User not found");
        }

        if (otherUser.id === self.id) {
            return true;
        }

        // Check for existing follow
        const { data: existingFollow, error: followError } = await supabase
            .from('follow') // Using public.follow
            .select()
            .eq('follower_id', self.id)
            .eq('following_id', otherUser.id)
            .single();

        if (followError && followError.code !== 'PGRST116') {
            console.error('Error checking follow status:', followError);
            throw followError;
        }
        
        return !!existingFollow;
    } catch (error) {
        console.error('Error in isFollowingUser:', error);
        return false;
    }
};

export const followUser = async (id: string, session: any) => {
    try {
        if (!session) throw new Error("Not authenticated");
        
        const self = await getSelf();
        const supabase = getSupabase(session);

        // Check if user exists
        const { data: otherUser, error: userError } = await supabase
            .from('users') // Using public.users
            .select()
            .eq('id', id)
            .single();

        if (userError || !otherUser) {
            console.error('User not found:', userError);
            throw new Error("User not found");
        }

        if (otherUser.id === self.id) {
            throw new Error("Cannot follow yourself");
        }

        // Check for existing follow
        const { data: existingFollow, error: followError } = await supabase
            .from('follow') // Using public.follow
            .select()
            .eq('follower_id', self.id)
            .eq('following_id', otherUser.id)
            .single();

        if (existingFollow) {
            throw new Error("Already following");
        }

        // Create new follow
        const { data: follow, error: createError } = await supabase
            .from('follow') // Using public.follow
            .insert({
                follower_id: self.id,
                following_id: otherUser.id
            })
            .select(`
                *,
                following:users!follow_following_id_fkey (*),
                follower:users!follow_follower_id_fkey (*)
            `)
            .single();

        if (createError) {
            console.error('Error creating follow:', createError);
            throw createError;
        }
        
        return follow;
    } catch (error) {
        console.error('Error in followUser:', error);
        throw error;
    }
};

export const unfollowUser = async (id: string, session: any) => {
    try {
        if (!session) throw new Error("Not authenticated");
        
        const self = await getSelf(session);
        const supabase = getSupabase(session);

        // Check if user exists
        const { data: otherUser, error: userError } = await supabase
            .from('users') // Using public.users
            .select()
            .eq('id', id)
            .single();

        if (userError || !otherUser) {
            console.error('User not found:', userError);
            throw new Error("User not found");
        }

        if (otherUser.id === self.id) {
            throw new Error("Cannot unfollow yourself");
        }

        // Check for existing follow
        const { data: existingFollow, error: followError } = await supabase
            .from('follow') // Using public.follow
            .select()
            .eq('follower_id', self.id)
            .eq('following_id', otherUser.id)
            .single();

        if (!existingFollow) {
            throw new Error("Not following");
        }

        // Delete follow
        const { data: follow, error: deleteError } = await supabase
            .from('follow') // Using public.follow
            .delete()
            .eq('id', existingFollow.id)
            .select(`
                *,
                following:users!follow_following_id_fkey (*)
            `)
            .single();

        if (deleteError) {
            console.error('Error unfollowing user:', deleteError);
            throw deleteError;
        }
        
        return follow;
    } catch (error) {
        console.error('Error in unfollowUser:', error);
        throw error;
    }
};