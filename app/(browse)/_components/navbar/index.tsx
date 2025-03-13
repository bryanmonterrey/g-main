import WalletConnectButton from "@/components/wallet/wallet-connect-button";
import Logo from "./logo";
import { NavItems } from "./navItems";
import { useSession } from 'next-auth/react';
import { Loader } from "@/components/ui/loader";

const NavBar: React.FC = () => {
  const { data: session } = useSession();
  

  

    return (
      <nav className='fixed top-0 w-full h-[52px] z-10 bg-gradient-to-b from-[#000000] via-[#000000]/50 to-[#000000]/0 pr-1 pl-1 flex justify-between items-center'>
       
        <div className='gap-x-2 ml-2 inline-flex items-center justify-center'>
          <Logo />
          <NavItems session={session} />
        </div>
      
        <div className='transition-all ease-in-out duration-300'>
          <WalletConnectButton />
        </div>
        
        
      </nav>
    );
};

export default NavBar;