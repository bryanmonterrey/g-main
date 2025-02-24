import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { SolanaAgentKit } from "../../index";
import { getAssociatedTokenAddress } from "@solana/spl-token";

/**
 * Get the balance of SOL or an SPL token for the agent's wallet
 * @param agent - SolanaAgentKit instance
 * @param token_address - Optional SPL token mint address. If not provided, returns SOL balance
 * @returns Promise resolving to the balance as a number (in UI units) or 0 if account doesn't exist
 */
export async function get_balance(
  agent: SolanaAgentKit,
  token_address?: PublicKey,
): Promise<number> {
  if (!token_address) {
    // Get SOL balance
    return (
      (await agent.connection.getBalance(agent.publicKey)) / // Changed from wallet_address to publicKey
      LAMPORTS_PER_SOL
    );
  }

  try {
    // Get associated token account address
    const ata = await getAssociatedTokenAddress(
      token_address,
      agent.publicKey // Changed from wallet_address to publicKey
    );

    // Get token balance
    const tokenAccount = await agent.connection.getTokenAccountBalance(ata);
    return tokenAccount.value.uiAmount || 0;
  } catch (error) {
    // Return 0 if token account doesn't exist
    return 0;
  }
}