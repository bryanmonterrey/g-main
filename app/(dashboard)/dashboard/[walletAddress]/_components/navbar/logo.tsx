import Image from "next/image";
import React from 'react'
import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/chat">
    <div className="flex flex-col cursor-pointer items-center font-english justify-center pl-1 gap-y-20 opacity-90 hover:opacity-100 transition-all duration-300 ease-in-out">
        <div className='h-2 w-2 bg-juul rounded-full'>

        </div>
        </div>
        </Link>
  )
}

export default Logo