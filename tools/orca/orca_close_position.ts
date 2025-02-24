import {
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  Transaction,
} from "@solana/web3.js";
import { SolanaAgentKit } from "../../agent";
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  WhirlpoolContext,
  buildWhirlpoolClient,
  PDAUtil,
} from "@orca-so/whirlpools-sdk";
import { Percentage } from "@orca-so/common-sdk";

// Create a proper adapter for Orca's expected Wallet type adapter example
class OrcaWalletAdapter {
  constructor(private agent: SolanaAgentKit) {}

  get publicKey() {
    return this.agent.publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    return await this.agent.wallet.signTransaction(tx) as T;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    return await this.agent.wallet.signAllTransactions(txs) as T[];
  }
}

export async function orcaClosePosition(
  agent: SolanaAgentKit,
  positionMintAddress: PublicKey,
): Promise<string> {
  try {
    // Create wallet adapter for Orca
    const orcaWallet = new OrcaWalletAdapter(agent);
    
    const ctx = WhirlpoolContext.from(
      agent.connection,
      orcaWallet,
      ORCA_WHIRLPOOL_PROGRAM_ID,
    );
    const client = buildWhirlpoolClient(ctx);

    // Get position details
    const positionAddress = PDAUtil.getPosition(
      ORCA_WHIRLPOOL_PROGRAM_ID,
      positionMintAddress,
    );
    const position = await client.getPosition(positionAddress.publicKey);
    const whirlpoolAddress = position.getData().whirlpool;
    const whirlpool = await client.getPool(whirlpoolAddress);

    // Build transaction
    const txBuilder = await whirlpool.closePosition(
      positionAddress.publicKey,
      Percentage.fromFraction(1, 100),
    );
    const txPayload = await txBuilder[0].build();
    
    // Get transaction message and instructions
    const txMessage = TransactionMessage.decompile(
      (txPayload.transaction as VersionedTransaction).message,
    );

    // Get latest blockhash
    const { blockhash } = await agent.connection.getLatestBlockhash();

    // Create versioned transaction
    const tx = new VersionedTransaction(
      new TransactionMessage({
        payerKey: agent.publicKey,
        recentBlockhash: blockhash,
        instructions: txMessage.instructions,
      }).compileToV0Message()
    );

    // If there are additional signers, sign with them first
    if (txPayload.signers?.length) {
      tx.sign(txPayload.signers);
    }

    // Let the agent handle signing and sending
    return await agent.sendTransaction(tx, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
      maxRetries: 5,
    });
  } catch (error) {
    throw new Error(`Failed to close Orca position: ${error}`);
  }
}