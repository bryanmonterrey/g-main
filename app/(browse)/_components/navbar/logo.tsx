import React from 'react'
import Link from 'next/link'

const Logo = () => {
  return (
    <Link href="/">
        <div className="flex flex-col cursor-pointer z-[50] font-oef text-base text-white font-medium pl-1.5 items-center opacity-90 active:scale-95 justify-center pr-1 pt-2 gap-y-20 pb-2 hover:opacity-100 transition">
            g
        </div>
    </Link>
  )
}

export default Logo