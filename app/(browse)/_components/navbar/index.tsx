import WalletConnectButton from "@/components/Wallet/wallet-connect-button";
import Logo from "./logo";
import { NavItems } from "./navItems";
import { useTransitionRouter } from 'next-view-transitions';
import { useSession } from 'next-auth/react';

interface PopoverItem {
  key: string;
  label: string;
  url: string;
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | string;
}

const NavBar: React.FC = () => {
  const { data: session } = useSession();
  const router = useTransitionRouter();
  const popoverItems: PopoverItem[] = [
    { key: "about", label: "About", url: "/assets/about" },
    { key: "advertisers", label: "Advertisers", url: "/assets/advertisers" },
    { key: "guidelines", label: "Community Guidelines", url: "/assets/community-guidelines" },
    { key: "contact", label: "Contact", url: "/assets/contact" },
    { key: "feature-requests", label: "Feature Requests", url: "/assets/feature-requests" },
    { key: "gift-cards", label: "Gift Cards", url: "/assets/gift-cards" },
    { key: "investors", label: "Investors", url: "/assets/investors" },
    { key: "merch", label: "Merch", url: "/assets/merch" },
    { key: "newsletter", label: "Newsletter", url: "/assets/newsletter" },
    { key: "support", label: "Support", url: "/assets/support" },
    { key: "terms", label: "Terms and Conditions", url: "/assets/terms" },
  ];

  const handlePopoverItemSelect = (key: string) => {
    const selectedItem = popoverItems.find(item => item.key === key);
    if (selectedItem) {
      console.log(`Selected item: ${key}, redirecting to: ${selectedItem.url}`);
      router.push(selectedItem.url);
    }
  };

    return (
      <nav className='fixed top-0 w-full h-[44px] z-[1000] lg:pr-1 lg:pl-1 flex justify-between items-center'>
       
       <div className='gap-x-3 ml-2 inline-flex items-center justify-center'>
          <Logo />
          
          <NavItems session={session} popoverItems={popoverItems} handlePopoverItemSelect={handlePopoverItemSelect} />
          </div>
      
          <div className='transition-all ease-in-out duration-300'>
            <WalletConnectButton />
          </div>
        
        
      </nav>
    );
};

export default NavBar;