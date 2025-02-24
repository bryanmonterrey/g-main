"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, MotionConfig, motion } from "framer-motion"
import useMeasure from "react-use-measure"

import { FamilyButton } from "../ui/family-button"
import { Button } from "../ui/button"
import { useChatStore } from "@/store/useChatStore";
import { cn } from "@/lib/utils";
import { useTransitionRouter } from 'next-view-transitions';
import { Plus, Trash } from "@phosphor-icons/react";
import { MOCK_MODELS } from "../chat/ChatInput";


export function FamilyButtonDemo() {
  return (
    <div className=" w-full h-full min-h-[240px]">
      <div className="absolute bottom-4 right-4 ">
        <FamilyButton>
          <MusicPlayerExample />
        </FamilyButton>
      </div>
    </div>
  )
}

let tabs = [
  { id: 0, label: "Apple" },
  { id: 1, label: "Spotify" },
]

export function MusicPlayerExample() {
  const router = useTransitionRouter();
  const [activeTab, setActiveTab] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [ref, bounds] = useMeasure()
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const {
    sessions,
    currentSessionId,
    addSession,
    setCurrentSession,
    deleteSession,
    getSessionById,
} = useChatStore();

const handleSessionClick = (sessionId: number) => {
    setCurrentSession(sessionId);
    router.push(`/chat/${sessionId}`);
};

  const content = useMemo(() => {
    switch (activeTab) {
      case 0:
        return (
          <div className="flex items-center justify-center">
            {/* New Thread Button */}
						<Button
							variant="default"
							className={cn(
								"h-11 bg-blue-400/10 text-blue-400 hover:bg-blue-400/20",
								!isExpanded && !isMobile && "justify-center p-2",
							)}
							onClick={() => {
								const newSession = addSession(
									currentSessionId
										? (getSessionById(currentSessionId)?.model ??
												MOCK_MODELS[0])
										: MOCK_MODELS[0],
								);
								router.push(`/chat/${newSession.id}`);
							}}
						>
							<Plus size={17} weight="bold" />
						</Button>
          </div>
        )
      case 1:
        return (
          <div className="flex items-center justify-center">
            {/* Recent Items - Only show when expanded on desktop */}
					{(isExpanded || (!isExpanded && isMobile)) && (
						<div className="flex-1 min-h-0">
							<div className="flex items-center justify-between px-6 py-2 shrink-0">
								<div className="text-sm font-medium text-white">
									Recent
								</div>
								<div className="text-xs text-white">
									{sessions.length} chats
								</div>
							</div>
							<div className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
								{sessions.map((item, index) => (
									<Button
										key={index}
										variant="ghost"
										className={cn(
											"group flex flex-col items-start w-full px-2 sm:px-3 py-2 sm:py-2.5 h-auto",
											"overflow-hidden relative",
											currentSessionId === item.id
												? "bg-muted"
												: "hover:bg-muted/50",
										)}
										onClick={() => handleSessionClick(item.id)}
									>
										<div className="w-full">
											<div
												className={cn(
													"text-[13px] sm:text-[14px] text-left truncate",
													currentSessionId === item.id
														? "text-foreground"
														: "text-white",
												)}
											>
												{item.title}
											</div>
											<div className="text-[11px] sm:text-[12px] text-white mt-1 text-left truncate">
												{item.timestamp}
											</div>
										</div>

										{/* Delete button */}
										<Button
											variant="ghost"
											size="icon"
											className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
											onClick={(e) => {
												e.stopPropagation();
												deleteSession(item.id);
											}}
										>
											<Trash size={14} weight="bold" />
										</Button>
									</Button>
								))}
							</div>
						</div>
					)}
        
          </div>
        )
      default:
        return null
    }
  }, [activeTab])

  const handleTabClick = (newTabId: number) => {
    if (newTabId !== activeTab && !isAnimating) {
      const newDirection = newTabId > activeTab ? 1 : -1
      setDirection(newDirection)
      setActiveTab(newTabId)
    }
  }

  const variants = {
    initial: (direction: number) => ({
      x: 300 * direction,
      opacity: 0,
      filter: "blur(4px)",
    }),
    active: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
    },
    exit: (direction: number) => ({
      x: -300 * direction,
      opacity: 0,
      filter: "blur(4px)",
    }),
  }

  return (
    <div className="flex flex-col items-center pt-4 ">
      <div className="flex space-x-1 border border-none rounded-[8px] cursor-pointer bg-neutral-700  px-[3px] py-[3.2px] shadow-inner-shadow">
        {tabs.map((tab, i) => (
          <button
            key={`${tab.id}-i-${i}`}
            onClick={() => handleTabClick(tab.id)}
            className={`${
              activeTab === tab.id ? "text-white " : "hover:text-neutral-300/60"
            } relative rounded-[5px] px-3 py-1.5 text-xs sm:text-sm font-medium text-neutral-600  transition focus-visible:outline-1 focus-visible:ring-1 focus-visible:ring-blue-light focus-visible:outline-none`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {activeTab === tab.id && (
              <motion.span
                layoutId="family-bubble"
                className="absolute inset-0 z-10 bg-neutral-800  mix-blend-difference shadow-inner-shadow"
                style={{ borderRadius: 5 }}
                transition={{ type: "spring", bounce: 0.19, duration: 0.4 }}
              />
            )}
            {tab.label}
          </button>
        ))}
      </div>
      <MotionConfig transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}>
        <motion.div
          className="relative mx-auto my-[10px] w-[60px] md:w-[150px] overflow-hidden"
          initial={false}
          animate={{ height: bounds.height }}
        >
          <div className="md:p-6 p-2" ref={ref}>
            <AnimatePresence
              custom={direction}
              mode="popLayout"
              onExitComplete={() => setIsAnimating(false)}
            >
              <motion.div
                key={activeTab}
                variants={variants}
                initial="initial"
                animate="active"
                exit="exit"
                custom={direction}
                onAnimationStart={() => setIsAnimating(true)}
                onAnimationComplete={() => setIsAnimating(false)}
              >
                {content}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </MotionConfig>
    </div>
  )
}
