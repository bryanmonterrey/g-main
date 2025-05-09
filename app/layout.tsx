import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Analytics } from "@vercel/analytics/react"
import Providers from '../components/providers';
import { Toaster } from "@/components/ui/sonner"

import "@solana/wallet-adapter-react-ui/styles.css";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "console",
  description: "always here",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
    
      <html lang="en" className="hidden-scrollbar">
        <body className={`antialiased hidden-scrollbar`}>       
            
              {children}    
              
          <Analytics />
          <Toaster position="bottom-center" richColors />
        </body>
      </html>
    
    </Providers>   
  );
}
