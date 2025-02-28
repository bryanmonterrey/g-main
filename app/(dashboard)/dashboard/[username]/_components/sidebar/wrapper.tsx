"use client";

import { cn } from "@/lib/utils";
import { useCreatorSidebar } from "@/store/use-creator-sidebar";
import Link from "next/link";
import { LogOut } from 'lucide-react';
import Logo from './logo'
import { Button } from '@/components/ui/button';    

interface WrapperProps {
    children: React.ReactNode;
};

export const Wrapper = ({
    children,
}: WrapperProps) => {
    const { collapsed } = useCreatorSidebar((state) => state);

    return (
        <aside className={cn(
            "transition-all fixed left-0 flex flex-col w-[44px] lg:w-60 h-[calc(100vh-44px)] bg-black/90 z-50",
            collapsed && "transition-all lg:w-[44px]"
        )}>
            {children}
            <div className='flex items-end justify-center mt-auto mb-5 bottom-2'>
        </div>
        </aside>
    );
};