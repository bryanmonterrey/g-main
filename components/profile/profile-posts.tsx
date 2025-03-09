"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSupabase } from "@/utils/supabase/getDataWhenAuth";
import { getSession } from "next-auth/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

const PROFILE_TABS = [
  { id: "posts", name: "Posts" },
  { id: "media", name: "Media" },
  { id: "vods", name: "VODs" },
  { id: "live", name: "Live" },
  { id: "shop", name: "Shop" },
  { id: "calls", name: "Calls" },
  { id: "premium", name: "Premium" },
  { id: "music", name: "Music" },
  { id: "about", name: "About" },
];

export const ProfilePosts = ({
  userId,
  username,
  isOwnProfile,
}: ProfilePostsProps) => {
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
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

    // Only fetch posts when posts tab is active
    if (activeTab === "posts") {
      fetchPosts();
    } else {
      // Reset loading state for other tabs
      setIsLoading(false);
    }
  }, [userId, activeTab]);

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    switch (activeTab) {
      case "posts":
        if (posts.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
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
        
      case "media":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <p className="text-sm">No media content available</p>
          </div>
        );
        
      case "vods":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <p className="text-sm">No VODs available</p>
          </div>
        );
        
      case "live":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <p className="text-sm">Not currently live</p>
          </div>
        );
        
      case "shop":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <p className="text-sm">Shop is empty</p>
          </div>
        );
        
      case "calls":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <p className="text-sm">No calls available</p>
          </div>
        );
        
      case "premium":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <p className="text-sm">No premium content available</p>
          </div>
        );
        
      case "music":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <p className="text-sm">No music available</p>
          </div>
        );
        
      case "about":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <p className="text-sm">No about information available</p>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2 w-full max-w-[85ch] mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap overflow-x-auto">
        {PROFILE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-full transition-all relative z-10",
              activeTab === tab.id
                ? "gradient-text" // Dark text for contrast
                : "text-white/70 hover:text-white"
            )}
          >
            {tab.name}
            
            {/* Animated pill background */}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="profileTabHighlight"
                className="absolute inset-0 bg-white/15 rounded-full -z-10"
                initial={false}
                transition={{ 
                    type: "spring", 
                    stiffness: 250, 
                    damping: 30 
                  }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-zinc-950 rounded-3xl p-4 outline outline-zinc-600/15">
        {renderTabContent()}
      </div>
    </div>
  );
};