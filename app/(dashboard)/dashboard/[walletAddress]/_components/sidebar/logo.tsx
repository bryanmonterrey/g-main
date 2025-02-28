import Image from "next/image";
import React from 'react'
import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/" className="bottom-1 flex flex-col justify-end">
      <div className="flex bottom-1 text-[#fff] flex-col cursor-pointer items-center justify-end pt-2 gap-y-20 pb-3 hover:opacity-90 transition">
        <Image src="/logo.png" alt="Logo" width={150} height={200} />
      </div>
    </Link>
  )
}

export default Logo