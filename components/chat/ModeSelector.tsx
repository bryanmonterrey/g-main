"use client";

import { CaretDown, Browser } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const AGENT_MODES = [
  {
    title: "Web",
    description: "Browse and analyze web content",
    icon: Browser,
  },
];

interface ModeSelectorProps {
  selectedMode: (typeof AGENT_MODES)[0];
  onModeChange: (mode: (typeof AGENT_MODES)[0]) => void;
}

export function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 py-1.5 px-2.5 -ml-2.5 rounded-lg",
            "text-sm text-white/50 hover:text-white",
            "transition-all duration-300 ease-in-out",
            "group",
          )}
        >
          <div className="text-white transition-transform duration-200 ease-out group-hover:scale-110">
            <selectedMode.icon className="w-4 h-4" weight="bold" />
          </div>
          <span className="font-medium">{selectedMode.title}</span>
          <CaretDown size={14} weight="bold" className="text-white" />
        </button>
      </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-1 bg-white/5 border border-white/5">
        {AGENT_MODES.map((mode,index) => (
          <DropdownMenuItem
            key={index} 
            onClick={() => onModeChange(mode)}
            className={cn(
              "flex items-center gap-2 px-2 py-2 rounded-md text-sm",
              "hover:bg-white/10",
              mode.title === selectedMode.title ? "text-white" : "text-white/50",
            )}
          >
            <div className="text-white">
              <mode.icon className="w-4 h-4" weight="bold" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{mode.title}</span>
              <span className="text-xs text-white/50">{mode.description}</span>
            </div>
            {mode.title === selectedMode.title && (
              <div className="ml-auto">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
