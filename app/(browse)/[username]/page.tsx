// app/(browse)/[username]/page.tsx
import { getUserByUsername } from "@/lib/auth-service.server";
import ProfileClient from "./profile-client";

interface ProfilePageProps {
  params: {
    username: string;
  };
}

const ProfilePage = async ({ params }: ProfilePageProps) => {
  return <ProfileClient username={params.username} />;
};

export default ProfilePage;