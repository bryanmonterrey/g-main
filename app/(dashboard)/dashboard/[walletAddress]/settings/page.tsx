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

    

    return (
        <div className="bg-black h-[calc(100vh-44px)]">           
            {/* Your content here */}
        </div>
    );
};

export default CreatorPage;