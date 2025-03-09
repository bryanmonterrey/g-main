import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface TabsProps {
  categories: {
    id: string;
    name: string;
    title: string;
  }[];
  activeCategory: string;
  setActiveCategory: (id: string) => void;
  filteredCount: number;
}

export function IntegrationTabs({ 
  categories, 
  activeCategory, 
  setActiveCategory,
  filteredCount 
}: TabsProps) {
  return (
    <div className="flex flex-col gap-4 px-1 mb-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-white/80">
          Integrations
        </h2>
        <span className="text-sm font-semibold text-white/90">
          ({filteredCount})
        </span>
      </div>
      
      <div className="flex gap-2 flex-wrap relative">
        {categories.map((category, index) => (
          <button
            key={index}
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              "px-3 py-1 text-sm font-semibold rounded-full transition-all relative z-10",
              activeCategory === category.id
                ? "text-zinc-900" // Dark text for contrast against amber background
                : "text-azul/70 hover:text-white"
            )}
            title={category.title}
          >
            {category.name}
            
            {/* Animated pill background that moves between tabs */}
            {activeCategory === category.id && (
              <motion.div 
                layoutId="tabHighlight"
                className="absolute inset-0 bg-azul rounded-full -z-10"
                initial={false}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 30 
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}