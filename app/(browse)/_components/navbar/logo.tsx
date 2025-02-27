import React from 'react'
import Link from 'next/link'

const Logo = () => {
  return (
    <Link href="/">
        <div className="flex flex-col cursor-pointer z-[50] font-english text-lg text-white font-medium pl-1 items-center opacity-90 active:scale-95 justify-center pr-1 gap-y-20 pb-2 hover:opacity-100 transition-all duration-300 ease-in-out">
            g
        </div>
    </Link>
  )
}

export default Logo