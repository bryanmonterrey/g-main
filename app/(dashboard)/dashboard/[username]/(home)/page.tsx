"use client";

import { getSelfByUsername } from "@/lib/auth-service";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CreatorPageProps {
    params: {
        username: string;
    };
}

const CreatorPage = ({
    params,
}: CreatorPageProps) => { 
    const { data: session, status } = useSession();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            if (session) {
                try {
                    const userData = await getSelfByUsername(params.username, session);
                    // Check if the user has the proper authorization
                    if (!userData) {
                        throw new Error("Unauthorized");
                    }
                    setUser(userData);
                } catch (error) {
                    console.error("Error fetching user:", error);
                    router.push("/unauthorized");
                } finally {
                    setLoading(false);
                }
            } else if (status === "unauthenticated") {
                router.push("/signin");
            }
        };

        if (status !== "loading") {
            fetchData();
        }
    }, [session, status, params.username, router]);

    if (status === "loading" || loading) {
        return <div>Loading...</div>; // Or your custom loading component
    }

    if (!user) {
        return null; // Render nothing while redirecting
    }

    return (
        <div className="bg-black h-[calc(100vh-44px)]">           
            {/* Your content here */}
        </div>
    );
};

export default CreatorPage;