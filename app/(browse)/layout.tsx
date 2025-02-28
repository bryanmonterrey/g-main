"use client";

import React, { Suspense, useEffect } from 'react'
import NavBar from './_components/navbar';
import { Container } from './_components/container';
import { useRouter } from 'next/navigation'
import { DynamicIslandDemo } from '@/components/layout/island';
import Sidebar, { SidebarSkeleton} from './_components/sidebar';

import { useSession } from "next-auth/react";

const BrowseLayout = ({ 
    children, 
}: {
    children: React.ReactNode;
}) => {

    const { data: session } = useSession();
    const router = useRouter();
  
    useEffect(() => {
      if (!session) {
        const timer = setTimeout(() => {
          router.push("/");
        }, 2000);
  
        return () => clearTimeout(timer);
      }
    }, [session, router]);

  return ( 
    <>
    <NavBar />
        <div className="transition-all hidden-scrollbar flex h-full pt-[46px]" >
        <Suspense fallback={<SidebarSkeleton />}>
                <Sidebar />
            </Suspense>
              

            <Container>
                {children}
            </Container>
        </ div>
    </>
   
  )
}

export default BrowseLayout