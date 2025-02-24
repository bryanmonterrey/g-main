import WalletConnectButton from "@/components/wallet/wallet-connect-button";
import Logo from "./logo";
import { NavItems } from "./navItems";
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';



const NavBar: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  

  

    return (
      <nav className='fixed top-0 w-full h-[44px] z-[1000] lg:pr-1 lg:pl-1 flex justify-between items-center'>
       
       <div className='gap-x-3 ml-2 inline-flex items-center justify-center'>
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