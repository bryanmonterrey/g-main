import { LAMPORTS_PER_SOL, type PublicKey } from "@solana/web3.js";
import type { SolanaAgentKit } from "@/agent";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getTokenMetadata } from "../../utils/tokenMetadata";

/**
 * Get the token balances of a Solana wallet
 * @param agent - SolanaAgentKit instance
 * @param walletAddress - Optional wallet address to check. If not provided, uses the agent's publicKey
 * @returns Promise resolving to the balance as an object containing sol balance and token balances with their respective mints, symbols, names and decimals
 */
export async function get_token_balance(
  agent: SolanaAgentKit,
  walletAddress?: PublicKey,
): Promise<{
  sol: number;
  tokens: Array<{
    tokenAddress: string;
    name: string;
    symbol: string;
    balance: number;
    decimals: number;
  }>;
}> {
  const [lamportsBalance, tokenAccountData] = await Promise.all([
    agent.connection.getBalance(walletAddress ?? agent.publicKey), // Changed from wallet_address to publicKey
    agent.connection.getParsedTokenAccountsByOwner(
      walletAddress ?? agent.publicKey, // Changed from wallet_address to publicKey
      {
        programId: TOKEN_PROGRAM_ID,
      },
    ),
  ]);

  const removedZeroBalance = tokenAccountData.value.filter(
    (v) => v.account.data.parsed.info.tokenAmount.uiAmount !== 0,
  );

  const tokenBalances = await Promise.all(
    removedZeroBalance.map(async (v) => {
      const mint = v.account.data.parsed.info.mint;
      const mintInfo = await getTokenMetadata(agent.connection, mint);
      return {
        tokenAddress: mint,
        name: mintInfo.name ?? "",
        symbol: mintInfo.symbol ?? "",
        balance: v.account.data.parsed.info.tokenAmount.uiAmount as number,
        decimals: v.account.data.parsed.info.tokenAmount.decimals as number,
      };
    }),
  );

  const solBalance = lamportsBalance / LAMPORTS_PER_SOL;

  return {
    sol: solBalance,
    tokens: tokenBalances,
  };
}