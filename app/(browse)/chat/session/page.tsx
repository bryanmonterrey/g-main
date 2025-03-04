"use client";

import { ChatSession } from "@/components/chat/ChatSession";
import { Suspense, useEffect } from "react";
import LocomotiveScroll from 'locomotive-scroll';

export default function ChatSessionPage() {

  useEffect(() => {
		if (typeof window !== 'undefined') {
		  const scrollContainer = document.querySelector('[data-scroll-container]') as HTMLElement | null;
	  
		  if (scrollContainer) {
			const locomotiveScroll = new (LocomotiveScroll as any)({
			  el: scrollContainer,
			  smooth: true,
			});
	  
			return () => {
			  if (locomotiveScroll) locomotiveScroll.destroy();
			};
		  }
		}
	  }, []);

  return (
    <div className="flex flex-col h-full" data-scroll-container>
      <Suspense fallback={<div></div>}>
        <ChatSession sessionId={1} initialMessages={[]} />
      </Suspense>
    </div>
  );
}
