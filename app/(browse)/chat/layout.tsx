'use client'

import { ChatProvider } from "@/components/chat/SolanaAgentProvider";
import { FamilyButtonDemo } from "@/components/chat/sessionbutton";
import { useEffect } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Dynamically import LocomotiveScroll
      (async () => {
        const LocomotiveScroll = (await import('locomotive-scroll')).default;
        const scrollContainer = document.querySelector('[data-scroll-container]') as HTMLElement | null;
        
        if (scrollContainer) {
          const locomotiveScroll = new LocomotiveScroll({
            el: scrollContainer,
            smooth: true,
          });
          
          return () => {
            if (locomotiveScroll) locomotiveScroll.destroy();
          };
        }
      })();
    }
  }, []);

  return (
          <ChatProvider>
            <div className="fixed inset-0 flex hidden-scrollbar" data-scroll-container>
              <main className="flex-1 relative overflow-y-auto hidden-scrollbar scroll-smooth" data-scroll-container>
                <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
                <div className="fixed bottom-0 right-0">
                <FamilyButtonDemo />
                </div>
              </main>
            </div>
          </ChatProvider>
    
  );
}
