import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

import { Skeleton } from "@/components/ui/skeleton";
import { 
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { LiveBadge } from "@/components/livebadge";

const avatarSizes = cva(
    "",
    {
        variants: {
            size: {
                default: "h-7 w-7",
                lg: "h-14 w-14",
            },
        },
        defaultVariants: {
            size: "default",
        },
    },

);

interface UserAvatarProps 
    extends VariantProps<typeof avatarSizes> {
    username: string;
    avatarUrl: string;
    isLive?: boolean;
    showBadge?: boolean;
};

export const UserAvatar = ({
    username,
    avatarUrl,
    isLive,
    showBadge,
    size,
}: UserAvatarProps) => {
    const canShowBadge = showBadge && isLive;

    return (
        <div className="relative">
        <Avatar
        className={cn(
            isLive && "ring-2 ring-[#00FFA2] transition-all ease-in-out duration-300 border border-black",
            avatarSizes({ size })

        )}
        >
           <AvatarImage src={avatarUrl} className="object-cover"/> 
           <AvatarFallback>
            
           </AvatarFallback>
        </ Avatar>
        {canShowBadge && (
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                <LiveBadge />
            </div>
        )}
        </div>
    );
};

interface UserAvatarSkeletonProps 
extends VariantProps<typeof avatarSizes> {};

export const UserAvatarSkeleton = ({
    size,
}: UserAvatarSkeletonProps) => {
    return (
        <Skeleton className={cn(
            "rounded-full",
            avatarSizes({ size }),
        )}     />
    );
};