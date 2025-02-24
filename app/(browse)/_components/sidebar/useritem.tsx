"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/store/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { UserAvatar } from "@/components/useravatar";
import { LiveBadge } from "@/components/livebadge";
import Image from "next/image";
import { CloudOff } from 'lucide-react';

interface UserItemProps {
    username: string;
    imageUrl: string;
    isLive?: boolean;
};

export const UserItem = ({
    username,
    avatarUrl,
    isLive,
}: UserItemProps) => {
    const pathname = usePathname();

    const { collapsed } = useSidebar((state) => state);

    const href = `/${username}`;
    const isActive = pathname === href;


    return (
        <Button
         asChild 
         variant="ghost"
         className={cn(
            "w-full h-10 px-2 rounded-[3px] hover:bg-buttongray/50",
            collapsed ? "justify-center my-0.5 h-9 w-9 hover:bg-lightpurp transition-all ease-soft-spring items-center flex rounded-full" : "items-center flex justify-center",
            isActive && "bg-buttongray/60",
            collapsed ? isActive && "bg-buttongray h-9 w-9 rounded-full" : "",
         )}
        >
            <Link href={href}>
            <div className={cn(
                "flex flex-row items-center w-full gap-x-3 ",
                collapsed && "flex justify-center items-center",
            )}>
                <UserAvatar 
                avatarUrl={avatarUrl}
                username={username}
                isLive={isLive}
                
                />
                {!collapsed && isLive && (
                    <div className="-space-y-[5px] text-md">
                    <p className="truncate font-extrabold  mb-0">
                        {username}
                    </p>
                    <p className="truncate font-medium  mt-0 text-white/80">
                        {username}   
                    </p>
                    </div>
                    
                )}
                {!collapsed && !isLive && (
                    <p className="truncate font-medium  mb-0 text-[#9b9b9b] text-opacity-80">
                        {username}
                    </p>
                )}
                {!collapsed && isLive && (
                    <Image src="/live.svg" alt="live" width={10} height={10} className="h-2.5 w-2.5 ml-auto text-black" />
                )}
                {!collapsed && !isLive &&(
                    <Image src="/zzz.svg" alt="offline" width={16} height={16} className="h-[16px] w-[16px] ml-auto opacity-80 "/>
                    
                )}
            </div>
            </Link>
            
        </Button>
    );
};

export const UserItemSkeleton = () => {
    return (
        <li className="flex items-center gap-x-4 px-1 py-2">
            <Skeleton className="min-h-[32px] min-w-[32px] rounded-full bg-buttongray/70"/>
            <div className="flex-1">
            <Skeleton className="h-6 bg-buttongray/70" />
            </div>
        </li>
    )
}