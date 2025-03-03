import React from 'react'
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home } from 'lucide-react';

const actions = () => {
  return (
    <div className='flex items-center justify-end gap-x-2 ml-4 lg:ml-0'>
        <Button
        size="sm"
        variant="ghost"
        className='text-white/85 rounded-full text-sm bg-zinc-900/90 px-3 font-semibold hover:bg-zinc-800 mr-3 border border-zinc-500/5 hover:text-white transition-all duration-300 ease-in-out'
        asChild >
            <Link href="/chat">
            <Home className='h-4 w-4 mr-2' strokeWidth={2.75}/>
                Exit Dashboard
            </Link>
        </Button>
        
    </div>
  )
}

export default actions