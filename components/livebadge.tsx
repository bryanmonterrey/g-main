import { cn } from "@/lib/utils";

interface LiveBadgeProps {
    className?: string;
};

export const LiveBadge = ({
    className,
}: LiveBadgeProps) => {
    return (
        <div className={cn(
            "bg-lightpurp text-center text-black p-0.5 px-1.5 rounded-sm uppercase text-[10px] border-[1/2px] border-background font-semibold tracking-wide",
            className,
        )}>
            Live
        </div>
    )
}
