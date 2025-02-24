import { getSupabase } from "@/utils/supabase/getDataWhenAuth";
import { getSelf } from "@/lib/auth-service";
import { useSession } from "next-auth/react";

export const getFollowedUsers = async () => {
    try {
        const self = await getSelf();
        const session = await useSession();
        const supabase = getSupabase(session);

        const { data: followedUsers, error } = await supabase
            .from('follow')
            .select(`
                id,
                following:users!following_id (
                    id,
                    username,
                    avatar_url,
                    wallet_address     
                )
            `)
            .eq('follower_id', self.id)
            .not('following.blocked_by.blocked_id', 'eq', self.id);

        if (error) throw error;
        return followedUsers || [];
    } catch {
        return [];
    }
}

export const isFollowingUser = async (id: string) => {
    try {
        const self = await getSelf();
        const session = await useSession();
        const supabase = getSupabase(session);

        // Check if user exists
        const { data: otherUser, error: userError } = await supabase
            .from('users')
            .select()
            .eq('id', id)
            .single();

        if (userError || !otherUser) {
            throw new Error("User not found");
        }

        if (otherUser.id === self.id) {
            return true;
        }

        // Check for existing follow
        const { data: existingFollow, error: followError } = await supabase
            .from('follow')
            .select()
            .eq('follower_id', self.id)
            .eq('following_id', otherUser.id)
            .single();

        if (followError && followError.code !== 'PGRST116') throw followError;
        return !!existingFollow;
    } catch {
        return false;
    }
};

export const followUser = async (id: string) => {
    const self = await getSelf();
    const session = await useSession();
    const supabase = getSupabase(session);

    // Check if user exists
    const { data: otherUser, error: userError } = await supabase
        .from('users')
        .select()
        .eq('id', id)
        .single();

    if (userError || !otherUser) {
        throw new Error("User not found");
    }

    if (otherUser.id === self.id) {
        throw new Error("Cannot follow yourself");
    }

    // Check for existing follow
    const { data: existingFollow, error: followError } = await supabase
        .from('follow')
        .select()
        .eq('follower_id', self.id)
        .eq('following_id', otherUser.id)
        .single();

    if (existingFollow) {
        throw new Error("Already following");
    }

    // Create new follow
    const { data: follow, error: createError } = await supabase
        .from('follow')
        .insert({
            follower_id: self.id,
            following_id: otherUser.id
        })
        .select(`
            *,
            following:users!following_id (*),
            follower:users!follower_id (*)
        `)
        .single();

    if (createError) throw createError;
    return follow;
};

export const unfollowUser = async (id: string) => {
    const self = await getSelf();
    const session = await useSession();
    const supabase = getSupabase(session);

    // Check if user exists
    const { data: otherUser, error: userError } = await supabase
        .from('users')
        .select()
        .eq('id', id)
        .single();

    if (userError || !otherUser) {
        throw new Error("User not found");
    }

    if (otherUser.id === self.id) {
        throw new Error("Cannot unfollow yourself");
    }

    // Check for existing follow
    const { data: existingFollow, error: followError } = await supabase
        .from('follow')
        .select()
        .eq('follower_id', self.id)
        .eq('following_id', otherUser.id)
        .single();

    if (!existingFollow) {
        throw new Error("Not following");
    }

    // Delete follow
    const { data: follow, error: deleteError } = await supabase
        .from('follow')
        .delete()
        .eq('id', existingFollow.id)
        .select(`
            *,
            following:users!following_id (*)
        `)
        .single();

    if (deleteError) throw deleteError;
    return follow;
};