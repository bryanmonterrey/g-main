// components/profile/profile-posts.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSupabase } from "@/utils/supabase/getDataWhenAuth";
import { getSession, useSession } from "next-auth/react";

interface ProfilePostsProps {
  userId: string;
  username: string | null;
  isOwnProfile: boolean;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  // Add other post fields as needed
}

export const ProfilePosts = ({
  userId,
  username,
  isOwnProfile,
}: ProfilePostsProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const session = await getSession();
        if (!session) {
          throw new Error("No session");
        }

        const supabase = getSupabase(session);
        
        // Replace this with your actual posts table query
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error("Error fetching posts:", error);
        toast.error("Failed to load posts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground bg-zinc-950 max-w-[85ch] min-w-[85ch] rounded-3xl mx-auto">
        <p className="text-sm">
          {isOwnProfile 
            ? "You haven't posted anything yet" 
            : `${username || 'This user'} hasn't posted anything yet`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div 
          key={post.id}
          className="border border-[#2D2E35] rounded-lg p-4"
        >
          <p className="text-sm">{post.content}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
};