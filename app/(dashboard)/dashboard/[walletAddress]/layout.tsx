// app/(dashboard)/dashboard/[username]/layout.tsx
"use client";

import { useSession } from "next-auth/react";
import { getSelfByWalletAddress } from "@/lib/auth-service";
import { redirect, useRouter } from "next/navigation";
import NavBar from "./_components/navbar";
import Sidebar from "./_components/sidebar";
import { Container } from "./_components/container";
import { useEffect, useState } from "react";

interface CreatorLayoutProps {
    params: { walletAddress: string };
    children: React.ReactNode;
}

const CreatorLayout = ({
    params,
    children,
}: CreatorLayoutProps) => {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    console.log("Layout rendering with params:", params);
    console.log("Session status:", status, "Session data:", session);

    useEffect(() => {
        const fetchData = async () => {
            if (session) {
                try {
                    console.log("Fetching user data with wallet address:", params.walletAddress);
                    const userData = await getSelfByWalletAddress(params.walletAddress, session);
                    console.log("User data fetched successfully:", userData);
                    setUser(userData);
                    setLoading(false);
                } catch (error) {
                    console.error("Error fetching user:", error);
                    setError(error instanceof Error ? error.message : 'An error occurred');
                    setLoading(false);
                    router.push("/chat");
                }
            } else if (status === "unauthenticated") {
                console.log("User is unauthenticated, redirecting");
                router.push("/chat");
            }
        };

        if (status !== "loading") {
            fetchData();
        }
    }, [session, status, params.walletAddress, router]);

    if (status === "loading" || loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!user) {
        return null;
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