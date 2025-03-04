// app/(browse)/_components/sidebar/wrapper.tsx

"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/store/sidebar";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { RecommendedSkeleton } from "./recommended";
import { FollowingSkeleton } from "./following";

interface WrapperProps {
    children: React.ReactNode
}

export const Wrapper = ({
    children,
}: WrapperProps) => {

    return (
        <motion.aside 
            className="w-[44px] fixed left-0 flex flex-col h-full z-50"      
            transition={{ duration: 0.25, ease: "easeInOut", spring: 0.5 }}
        >
            {children}
        </motion.aside>
    );
};