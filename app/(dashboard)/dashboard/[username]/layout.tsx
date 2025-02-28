// app/(dashboard)/dashboard/[username]/layout.tsx
"use client";

import { useSession } from "next-auth/react";
import { getSelfByUsername } from "@/lib/auth-service";
import { redirect, useRouter } from "next/navigation";
import NavBar from "./_components/navbar";
import Sidebar from "./_components/sidebar";
import { Container } from "./_components/container";
import { useEffect, useState } from "react";

interface CreatorLayoutProps {
    params: { username: string };
    children: React.ReactNode;
}

const CreatorLayout = ({
    params,
    children,
}: CreatorLayoutProps) => {
    const { data: session, status } = useSession();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            if (session) {
                try {
                    const userData = await getSelfByUsername(params.username, session);
                    setUser(userData);
                } catch (error) {
                    console.error("Error fetching user:", error);
                    router.push("/chat");
                } finally {
                    setLoading(false);
                }
            } else if (status === "unauthenticated") {
                router.push("/chat");
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
        <>   
            <NavBar />
            <div className="flex rounded-xl h-[calc(100%-46px)]">   
                <Container>
                    {children}
                </Container>
            </div>
        </>
    );
};

export default CreatorLayout;