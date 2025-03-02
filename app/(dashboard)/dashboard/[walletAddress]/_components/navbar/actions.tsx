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
        className='text-litepurp/90 rounded-full text-[15px] bg-buttongray px-3 font-semibold mr-3 hover:text-white'
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