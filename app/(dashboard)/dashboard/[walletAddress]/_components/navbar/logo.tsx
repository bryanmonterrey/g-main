import Image from "next/image";
import React from 'react'
import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/chat">
    <div className="flex text-[#fff] flex-col cursor-pointer items-center font-english justify-center pl-2 gap-y-20 opacity-90 hover:opacity-100 transition">
        <div className='h-2 w-2 bg-juul rounded-full'>

        </div>
        </div>
        </Link>
  )
}

export default Logo