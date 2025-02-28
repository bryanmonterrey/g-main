"use client";

import { useCreatorSidebar } from "@/store/use-creator-sidebar";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export const Toggle = () => {
    const {
        collapsed,
        onExpand, 
        onCollapse,
    } = useCreatorSidebar((state) => state);

    const label = collapsed ? "Expand" : "Collapse";

    return (
        <>
            {collapsed && (
                <Button onClick={onExpand} className="h-full bg-transparent rounded-none hover:bg-transparent" >
                <div onClick={onExpand} className="transition-all inline-block gap-y-4 w-full h-full lg:inline-block items-start justify-center pt-3 mb-4">
                    
                        <Button
                        onClick={onExpand}
                        variant="ghost"
                        className="h-auto p-2 "
                        >
                            <Image src="/plus.svg" alt="expand" width={14} height={14} className="text-lightpurp" />
                        </Button>
                    
                    <div>
                        <p className="-rotate-90 mt-32 text-white italic text-2xl font-semibold">Channel&nbsp;Tools</p>
                    </div>
                </div>
                </Button>
            )}
            {!collapsed && (
                <div className="transition-all p-3 pr-1.5 pt-[7px] pl-3 mb-2 hidden lg:flex items-center w-full justify-between">
                    <div>
                    <p className="text-xs font-semibold text-clipwhite transition-all ease-in-out">
                      CHANNEL&nbsp;TOOLS
                    </p>
                    </div>
                    <div>
                    
                        <Button onClick={onCollapse} variant="ghost" className="h-auto p-2 ml-auto">
                            <Image src="/minus.svg" alt="collapse" width={14} height={14} className="text-lightpurp"/>
                        </Button>
                    
                    </div>
                </div>
            )}
        </>
    );
};