import React from 'react';
import { Tooltip } from "@nextui-org/react";

interface HintProps {
    label: string;
    children: React.ReactNode;
    asChild?: boolean;
    placement?: 
        "top-start" | "top" | "top-end" | 
        "bottom-start" | "bottom" | "bottom-end" | 
        "left-start" | "left" | "left-end" | 
        "right-start" | "right" | "right-end";
}

export const Hint: React.FC<HintProps> = ({
    label,
    children,
    asChild = false,
    placement = "top", // default placement
}) => {
    return (
        <Tooltip
            content={label}
            color="foreground"
            delay={240}
            closeDelay={0}
            showArrow
            placement={placement}
            classNames={{
                base: [
                    "before:bg-white dark:before:bg-white before:rounded-[3px] z-[1001]",
                ],
                content: [
                    "py-1 px-2 shadow-none rounded-[8px] z-[1001]",
                    "text-black text-[14px] font-semibold bg-white z-[1001]",
                ],
            }}
        >
            <div className='z-[1]'>{asChild ? children : <span>{children}</span>}</div>
        </Tooltip>
    );
};

export default Hint;
