"use client";

import { useCreatorSidebar } from "@/store/use-creator-sidebar";
import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface NavItemProps {
    icon: LucideIcon | React.ReactElement;
    label: string;
    href: string;
    isActive: boolean;
};

export const NavItem = ({
    icon: Icon,
    label,
    href,
    isActive,
}: NavItemProps) => {
    const { collapsed } = useCreatorSidebar((state) => state);

    return (
        <Button 
        asChild
        variant="ghost"
        className={cn(
            "w-full rounded-sm h-10 px-2 gap-y-1",
            collapsed ? "justify-center" : "justify-start",
            isActive && "bg-white/5",          
        )}
        >
            <Link href={href}>
            <div className="flex items-center gap-x-4">
                {React.isValidElement(Icon) ? (
                    Icon
                ) : (
                    React.createElement(Icon as React.ElementType, {
                        className: cn(
                            "h-4 w-4",
                            collapsed ? "mr-0" : "mr-2"
                        ),
                        strokeWidth: 2.75
                    })
                )}
                {!collapsed && (
                    <span className="text-[17px] font-semibold">
                        {label}
                    </span>
                )}
            </div>
            </Link>
        </Button>
    );
};

export const NavItemSkeleton = () => {
    return (
        <li className="flex items-center gap-x-4 px-3 py-2">
            <Skeleton className="min-h-[48px] min-w-[48px] rounded-md" />
            <div className="flex-1 hidden lg:block">
                <Skeleton className="h-6" />
            </div>
        </li>
    )
}