// app/(browse)/[username]/page.tsx
"use client";

import { Profile } from "@/components/profile";
import { getUserByUsername } from "@/lib/auth-service.server";
import { isFollowingUser } from "@/lib/follow-servicee";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ProfilePageProps {
  params: {
    username: string;
  };
}

const ProfilePage = ({ params }: ProfilePageProps) => {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const userProfile = await getUserByUsername(params.username, session);
        if (userProfile) {
          setProfile(userProfile);
          const following = await isFollowingUser(userProfile.id);
          setIsFollowing(following);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchProfile();
    }
  }, [params.username, session]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return <div>User not found</div>;
  }

  const isOwnProfile = session?.user?.id === profile.id;

  return (
    <Profile
      user={profile}
      isOwnProfile={isOwnProfile}
      isFollowing={isFollowing}
    />
  );
};

export default ProfilePage;