import type { Metadata } from "next";
import SideNav from "@/components/layout/SideNav";
import { ChatProvider } from "@/components/chat/SolanaAgentProvider";

import { ViewTransitions } from "next-view-transitions";
import { FamilyButtonDemo } from "@/components/chat/sessionbutton";


export const metadata: Metadata = {
  title: "Solana Agent Terminal",
  description: "Solana Agent Terminal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
          <ChatProvider>
            <div className="fixed inset-0 flex hidden-scrollbar">
              <main className="flex-1 relative overflow-y-auto hidden-scrollbar scroll-smooth">
                <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
                <div className="fixed bottom-0 right-0">
                <FamilyButtonDemo />
                </div>
              </main>
            </div>
          </ChatProvider>
    </ViewTransitions>
  );
}
