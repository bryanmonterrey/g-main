"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface IntegrationCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  logo?: React.ComponentType<{ className?: string }>;
  category: string;
  onClick?: () => void;
}

export function IntegrationCard({ title, description, icon, logo: Logo, category, onClick }: IntegrationCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col gap-3 p-4",
        "bg-azul/10 border border-white/0 rounded-3xl",
        "text-left",
        "hover:bg-azul/35 hover:border-white/0",
        "transition-all duration-300 ease-in-out",
      )}
    >
      <div className="flex items-center gap-3">
        {Logo && <Logo className="w-6 h-6" />}
        {icon}
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-white/90">{title}</h3>
          <div className="text-xs font-semibold text-azul mt-0.5">{category}</div>
        </div>
      </div>
      <div className="text-sm font-semibold text-azul leading-relaxed">{description}</div>
    </button>
  );
}
