// app/(dashboard)/dashboard/[username]/_components/sidebar/navigation.tsx

"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { 
    Fullscreen,
    KeyRound,
    MessageSquare,
    Users,
} from "lucide-react"
import { NavItem, NavItemSkeleton } from "./navItem";
import Image from "next/image";

export const Navigation = () => {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const username = session?.user?.username || "";

    const routes = [
        {
            label: "Stream",
            href: `/dashboard/${username}`,
            icon: <Image src="/cam.svg" alt="cam" width={20} height={20}/>,
        },
        {
            label: "Personalization",
            href: `/dashboard/${username}/personalization`,
            icon: <Image src="/personalization.svg" alt="personalization" width={20} height={20}/>,
        },
        {
            label: "Keys",
            href: `/dashboard/${username}/keys`,
            icon: <Image src="/keys.svg" alt="keys" width={20} height={20}/>,
        },
        {
            label: "Chat",
            href: `/dashboard/${username}/chat`,
            icon: MessageSquare,
        },
        {
            label: "Community",
            href: `/dashboard/${username}/community`,
            icon: <Image src="/globe.svg" alt="globe" width={20} height={20}/>,
        },
        {
            label: "Monetization",
            href: `/dashboard/${username}/monetization`,
            icon: <Image src="/money.svg" alt="money" className="ml-0.5 mr-1" width={15} height={15}/>,
        },
        {
            label: "Subscriptions",
            href: `/dashboard/${username}/subscriptions`,
            icon: <Image src="/bolt3.svg" alt="bolt3" width={18} height={18} className="mr-0.5"/>,
        },
    ];

    if (status === "loading") {
        return (
            <ul className="space-y-0">
                {[...Array(4)].map((_, i) => (
                    <NavItemSkeleton key={i} />
                ))}
            </ul>
        );
    }

    return (
        <ul className="space-y-0 font-bold px-2 pt-4 lg:pt-0">
           {routes.map((route) => (
                <NavItem
                key={route.href} label={route.label} icon={route.icon} href={route.href} isActive={pathname === route.href}
                />
           ))}
        </ul>
    );
};