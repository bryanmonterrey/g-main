import { SolanaAgentKit } from "@/agent";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getMint,
  getAccount,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

/**
 * Transfer SOL or SPL tokens to a recipient
 * @param agent SolanaAgentKit instance
 * @param to Recipient's public key
 * @param amount Amount to transfer
 * @param mint Optional mint address for SPL tokens
 * @returns Transaction signature
 */
export async function transfer(
  agent: SolanaAgentKit,
  to: PublicKey,
  amount: number,
  mint?: PublicKey,
): Promise<string> {
  try {
    const transaction = new Transaction();

    if (!mint) {
      // Transfer native SOL
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: agent.publicKey, // Changed from wallet to publicKey
          toPubkey: to,
          lamports: amount * LAMPORTS_PER_SOL,
        }),
      );
    } else {
      // Transfer SPL token
      const fromAta = await getAssociatedTokenAddress(
        mint,
        agent.publicKey, // Changed from wallet_address to publicKey
      );
      const toAta = await getAssociatedTokenAddress(mint, to);

      try {
        await getAccount(agent.connection, toAta);
      } catch {
        // Error is thrown if the tokenAccount doesn't exist
        transaction.add(
          createAssociatedTokenAccountInstruction(
            agent.publicKey, // Changed from wallet_address to publicKey
            toAta,
            to,
            mint,
          ),
        );
      }

      // Get mint info to determine decimals
      const mintInfo = await getMint(agent.connection, mint);
      const adjustedAmount = amount * Math.pow(10, mintInfo.decimals);

      transaction.add(
        createTransferInstruction(
          fromAta,
          toAta,
          agent.publicKey, // Changed from wallet_address to publicKey
          adjustedAmount,
        ),
      );
    }

    // Use agent's sendTransaction instead of connection.sendTransaction
    return await agent.sendTransaction(transaction, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
      maxRetries: 5,
    });
  } catch (error: any) {
    throw new Error(`Transfer failed: ${error.message}`);
  }
}