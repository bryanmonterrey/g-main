"use client";

import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SolanaIcon } from "./icons/SolanaIcon";


type Item = {
  name: string;
  subTxt: string;
};
type DropdownCompProps = {
  selectedItems: Item;
  onItemsChange: (items: Item) => void;
  items: Item[];
};
export function DropdownComp({ selectedItems, onItemsChange, items }: DropdownCompProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-x-2 py-2 px-2.5 ml-2.5 rounded-full border border-zinc-950",
            "font-semibold text-muted-foreground text-sm hover:text-white bg-black/50 hover:bg-zinc-900/40",
            "transition-all duration-300 ease-in-out",
            "group",
          )}
        >
          
          <div className="transition-transform duration-300 ease-in-out group-hover:scale-110">
            <SolanaIcon className="w-4 h-4" />
          </div>
          <span className="font-semibold">{selectedItems.name.split(" ")[0]}</span>
          <CaretDown size={14} weight="bold" className="" strokeWidth={2.5} />
          
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-1 bg-black/50 border border-zinc-700/5">
        {items?.map((item,index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => onItemsChange(item)}
            className={cn(
              "flex items-center gap-2 px-2 py-2 rounded-md",
              "hover:bg-muted",
              item.subTxt === selectedItems.subTxt ? "text-white" : "text-white",
            )}
          >
            <div className="text-white/75">
              <SolanaIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-body-strong">{item.name}</span>
              <span className="wallet-address">{item.subTxt}</span>
            </div>
            {item.subTxt === selectedItems.subTxt && (
              <div className="ml-auto">
                <div className="w-1.5 h-1.5 rounded-full bg-white/75" />
              </div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
