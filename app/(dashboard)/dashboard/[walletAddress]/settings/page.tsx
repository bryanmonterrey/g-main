// app/(dashboard)/dashboard/[walletAddress]/settings/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileSettings } from "./_components/profileSetting";
import { ApiKeysSettings } from "./_components/ApiKeysSettings";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CreatorPageProps {
    params: {
        username: string;
    };
}

const SETTINGS_TABS = [
    { id: 'profile', name: 'Profile' },
    { id: 'api-keys', name: 'API Keys' },
];

const CreatorPage = ({
    params,
}: CreatorPageProps) => { 
    const { data: session, status } = useSession();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const router = useRouter();

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileSettings />;
            case 'api-keys':
                return <ApiKeysSettings />;
            default:
                return <ProfileSettings />;
        }
    };

    return (
        <div className="bg-black min-h-[calc(100vh-52px)]">
            <div className="max-w-6xl mx-auto p-4">
                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="flex gap-2 flex-wrap relative">
                        {SETTINGS_TABS.map((tab, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "py-1.5 px-3 text-sm font-semibold rounded-full transition-all relative z-10",
                                    activeTab === tab.id
                                        ? "text-white/80"
                                        : "text-azul/70 hover:text-white hover:bg-zinc-900/65"
                                )}
                            >
                                {tab.name}
                                
                                {/* Animated pill background */}
                                {activeTab === tab.id && (
                                    <motion.div 
                                        layoutId="tabHighlight"
                                        className="absolute inset-0 bg-azul/15 text-white rounded-full -z-10"
                                        initial={false}
                                        transition={{ 
                                            type: "spring", 
                                            stiffness: 250, 
                                            damping: 30 
                                        }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderContent()}
                </motion.div>
            </div>
        </div>
    );
};

export default CreatorPage;