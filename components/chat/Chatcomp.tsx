"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import {
	Coin,
	ImageSquare,
	Images,
	ArrowsLeftRight,
} from "@phosphor-icons/react";
import { AGENT_MODES } from "./ModeSelector";
import { MOCK_MODELS } from "../layout/goodinput";
import { IntegrationCard } from "./IntegrationCard";
import { ChatInput } from "../layout/goodinput";
import {
	MetaplexLogo,
	JupiterLogo,
	LightProtocolLogo,
	PythLogo,
	RaydiumLogo,
	LuloLogo,
	ArcadeLogo,
	AILogo,
	MeteoraLogo,
	DialectLogo,
	PumpFunLogo,
	SNSLogo,
	DexScreenerLogo,
	JitoLogo,
	SollayerLogo,
	ManifestLogo,
	TensorLogo,
	MagicEdenLogo,
} from "./icons";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/useChatStore";

import { useSession } from "next-auth/react";

const QUICK_SUGGESTIONS = [
	{ text: "Launch a Memecoin", category: "NFTs", icon: Coin },
	{ text: "List NFT", category: "NFTs", icon: ImageSquare },
	{ text: "Create NFT Collection", category: "NFTs", icon: Images },
	{ text: "Swap tokens", category: "DeFi", icon: ArrowsLeftRight },
] as const;

const CATEGORIES = [
	{ id: "all", name: "All", title: "All Integrations" },
	{ id: "defi", name: "DeFi", title: "Decentralized Finance" },
	{ id: "nfts", name: "NFTs", title: "NFT Tools" },
	{ id: "token", name: "Token", title: "Token Management" },
	{ id: "data", name: "Data", title: "Data & Analytics" },
	{ id: "infrastructure", name: "Infrastructure", title: "Infrastructure" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

const SUGGESTIONS = [
	{
		title: "Launch Token",
		description: "Create a memecoin on pump.fun",
		logo: PumpFunLogo,
		category: "token",
		prompt:
			"Help me create a new memecoin on pump.fun with the following specifications: token name, supply, and initial liquidity pool setup.",
	},
	{
		title: "NFT Management",
		description:
			"Deploy collections, mint NFTs, manage metadata and royalties via Metaplex",
		logo: MetaplexLogo,
		category: "nfts",
		prompt:
			"I want to create an NFT collection using Metaplex. Guide me through the process of setting up metadata, royalties, and deployment.",
	},
	{
		title: "Jupiter Exchange",
		description: "Execute token swaps using Jupiter Exchange for best rates",
		logo: JupiterLogo,
		category: "defi",
		prompt:
			"I want to swap 100 USDC for SOL using Jupiter Exchange. Guide me through the process of setting up the swap and providing the necessary parameters.",
	},
	{
		title: "Sollayer",
		description: "Explore and interact with Solana's Layer 2 solutions",
		logo: SollayerLogo,
		category: "infrastructure",
		prompt:
			"I want to explore Solana's Layer 2 solutions. Provide me with information on the latest developments and how to interact with them.",
	},
	{
		title: "Manifest",
		description: "Create and manage xNFTs for your dApp",
		logo: ManifestLogo,
		category: "nfts",
		prompt:
			"I want to create an xNFT collection using Manifest. Guide me through the process of setting up metadata, royalties, and deployment.",
	},
	{
		title: "Compressed Airdrops",
		description: "Send Zk compressed airdrops using Light Protocol and Helius",
		logo: LightProtocolLogo,
		category: "token",
		prompt:
			"I want to send a Zk compressed airdrop using Light Protocol and Helius. Guide me through the process of setting up the airdrop and providing the necessary parameters.",
	},
	{
		title: "Price Feeds",
		description: "Fetch real-time asset prices using Pyth Network",
		logo: PythLogo,
		category: "data",
		prompt:
			"I want to fetch real-time asset prices using Pyth Network. Provide me with information on the latest prices and how to interact with them.",
	},
	{
		title: "DexScreener",
		description: "Track real-time DEX trading data and market analytics",
		logo: DexScreenerLogo,
		category: "data",
		prompt:
			"I want to track real-time DEX trading data and market analytics. Provide me with information on the latest trading data and how to interact with them.",
	},
	{
		title: "Raydium Pools",
		description: "Create liquidity pools (CPMM, CLMM, AMMv4) on Raydium",
		logo: RaydiumLogo,
		category: "defi",
		prompt:
			"I want to create liquidity pools (CPMM, CLMM, AMMv4) on Raydium. Guide me through the process of setting up the pools and providing the necessary parameters.",
	},
	{
		title: "Lending by Lulo",
		description: "Access best APR for USDC lending via Lulo protocol",
		logo: LuloLogo,
		category: "defi",
		prompt:
			"I want to access best APR for USDC lending via Lulo protocol. Provide me with information on the latest lending rates and how to interact with them.",
	},
	{
		title: "Arcade Games",
		description: "Send and interact with Solana Arcade Games",
		logo: ArcadeLogo,
		category: "gaming",
		prompt:
			"I want to send and interact with Solana Arcade Games. Provide me with information on the latest games and how to interact with them.",
	},
	{
		title: "AI Integration",
		description: "LangChain tools, Vercel AI SDK, and autonomous agent support",
		logo: AILogo,
		category: "development",
		prompt:
			"I want to use LangChain tools, Vercel AI SDK, and autonomous agent support. Provide me with information on the latest tools and how to interact with them.",
	},
	{
		title: "Meteora DAMM",
		description:
			"Dynamic Automated Market Maker for efficient liquidity provision",
		logo: MeteoraLogo,
		category: "defi",
		prompt:
			"I want to use Dynamic Automated Market Maker for efficient liquidity provision. Provide me with information on the latest tools and how to interact with them.",
	},
	{
		title: "Dialect Chat",
		description: "Integrate web3 messaging and notifications for your dApp",
		logo: DialectLogo,
		category: "social",
		prompt:
			"I want to integrate web3 messaging and notifications for my dApp. Provide me with information on the latest tools and how to interact with them.",
	},
	{
		title: "Domain Services",
		description: "Register and resolve SNS domains and Alldomains",
		logo: SNSLogo,
		category: "infrastructure",
		prompt:
			"I want to register and resolve SNS domains and Alldomains. Provide me with information on the latest tools and how to interact with them.",
	},
	{
		title: "Jito Features",
		description: "Jito Bundles and JupSOL staking integration",
		logo: JitoLogo,
		category: "infrastructure",
		prompt:
			"I want to use Jito Bundles and JupSOL staking integration. Provide me with information on the latest tools and how to interact with them.",
	},
	{
		title: "Tensor Trading",
		description: "Trade NFTs with advanced analytics and real-time data",
		logo: TensorLogo,
		category: "nfts",
		prompt:
			"I want to trade NFTs with advanced analytics and real-time data. Provide me with information on the latest tools and how to interact with them.",
	},
	{
		title: "Magic Eden",
		description: "List and trade NFTs on the largest Solana marketplace",
		logo: MagicEdenLogo,
		category: "nfts",
		prompt:
			"I want to list and trade NFTs on the largest Solana marketplace. Provide me with information on the latest tools and how to interact with them.",
	},
] as const;

interface ChatcompProps {
	sessionId?: number;
}

export function Chatcomp({ sessionId }: ChatcompProps) {
	const { data: session } = useSession();
	const router = useRouter();
	const [input, setInput] = useState("");
	const [selectedMode, setSelectedMode] = useState(AGENT_MODES[0]);
	const [wallets, setWallets] = useState([{
		name: "Default Agent Wallet",
		subTxt: "AgN7....3Pda"
	}]);
	const [selectedWallet, setSelectedWallet] = useState(wallets?.[0] || null);
	const [selectedModel, setSelectedModel] = useState(MOCK_MODELS[0]);
	const [activeIntegrationCategory, setActiveIntegrationCategory] =
		useState<CategoryId>("all");
	const inputSectionRef = useRef<HTMLDivElement>(null);

	const { addSession, addMessageToSession, getSessionById, setInitialMessage } =
		useChatStore();

	const filteredIntegrations =
		activeIntegrationCategory === "all"
			? SUGGESTIONS
			: SUGGESTIONS.filter(
					(integration) => integration.category === activeIntegrationCategory,
				);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;

		try {
			// Create session first
			const newSession = addSession(selectedModel);

			// Add message and set initial message
			await Promise.all([
				addMessageToSession(newSession.id, {
					role: "user",
					content: input,
				}),
				setInitialMessage(input),
			]);

			// Force navigation to new session
			router.push(`/chat/${newSession.id}`);
			router.refresh(); // Add this to force a refresh if needed
		} catch (error) {
			console.error("Navigation error:", error);
		}
	};

	useEffect(() => {
		fetch("/api/wallet")
			.then((res) => res.json())
			.then((data) => {
				setWallets(data.wallets);
			});
	}, []);

	// Landing page UI (existing code)
	return (
		<div className="flex flex-col items-center justify-center min-h-screen px-4 py-16 sm:py-32 scroll-smooth">
			<div className="w-full max-w-3xl flex flex-col gap-[10vh] sm:gap-[20vh] mt-[10vh] sm:mt-[20vh]">
				<div
					className="flex flex-col gap-8 sm:gap-12 w-full"
					ref={inputSectionRef}
				>
					<div className="space-y-4">
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#DDDDDD]text-center">
							What can I help with?
						</h1>
					</div>
					<div className="space-y-4">
						<div className="rounded-3xl p-[5px] bg-zinc-950">
							<div className="text-[10px] sm:text-xs px-2 py-2 text-white/85">
							</div>
							<ChatInput
								input={input}
								setInput={setInput}
								onSubmit={handleSubmit}
								selectedMode={selectedMode}
								setSelectedMode={setSelectedMode}
								selectedWallet={selectedWallet}
								setSelectedWallet={setSelectedWallet}
								selectedModel={selectedModel}
								setSelectedModel={setSelectedModel}
							/>
						</div>
						<div className="flex flex-row flex-wrap gap-2 items-center justify-center">
							{QUICK_SUGGESTIONS.map((suggestion, index) => (
								<button
									key={index}
									onClick={() => setInput(suggestion.text)}
									className={cn(
										"px-4 py-2",
										"text-sm font-semibold",
										"bg-azul/10 border border-white/0 rounded-full",
										"text-azul",
										"hover:text-azul hover:bg-azul/30 hover:border-white/0",
										"transition-all duration-300 ease-in-out",
									)}
								>
									{suggestion.text}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="relative pt-4">
					<div className="flex flex-col gap-4 px-1 mb-6">
						<div className="flex items-center gap-2">
							<h2 className="text-xl font-semibold text-white">
								Integrations
							</h2>
							<span className="text-sm text-azul">
								({filteredIntegrations.length})
							</span>
						</div>
						<div className="flex gap-2 flex-wrap">
							{CATEGORIES.map((category, index) => (
								<button
									key={index}
									onClick={() => setActiveIntegrationCategory(category.id)}
									className={cn(
										"px-3 py-1 text-sm font-semibold rounded-full transition-colors",
										activeIntegrationCategory === category.id
											? "bg-azul/15 text-azul hover:bg-azul/35"
											: "text-white hover:text-white hover:bg-blue-400/10",
									)}
									title={category.title}
								>
									{category.name}
								</button>
							))}
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pb-16 sm:pb-32">
						{filteredIntegrations.map((integration, index) => (
							<IntegrationCard
								key={index}
								title={integration.title}
								description={integration.description}
								logo={integration.logo}
								category={integration.category}
								onClick={() => {
									setInput(integration.prompt);
									(
										document.querySelector(
											'input[type="text"]',
										) as HTMLInputElement
									)?.focus();
									inputSectionRef.current?.scrollIntoView({
										behavior: "smooth",
									});
								}}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
