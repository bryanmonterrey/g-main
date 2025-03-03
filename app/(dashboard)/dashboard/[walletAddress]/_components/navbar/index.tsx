import React from 'react'
import Logo from './logo';
import Actions from './actions';
import { Navigation } from './navigation';


const NavBar = () => {
  return (
    <nav className='fixed top-0 w-full h-[52px] backdrop-blur-custom backdrop-blur-lg z-[1000] bg-black/80 lg:pr-2 lg:pl-1 flex justify-between items-center'>
      <div className='inline-flex'>
        
        <div className='gap-x-3 ml-2 inline-flex items-center justify-center'>
        <Logo />
        <Navigation />
        </div>
      </div>

      
        <Actions />
        
    </nav>
  );
};

export default NavBar