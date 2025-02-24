import {
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  Transaction,
} from "@solana/web3.js";
import { SolanaAgentKit } from "../../agent";
import { Decimal } from "decimal.js";
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  WhirlpoolContext,
  PriceMath,
  PoolUtil,
  buildWhirlpoolClient,
} from "@orca-so/whirlpools-sdk";
import { sendTx } from "../../utils/send_tx";
import { FEE_TIERS } from "./orca_create_single_sided_liquidity_pool";

// Shared adapter between files
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

/**
 * # Creates a CLMM Pool (Concentrated Liquidity Market Maker Pool).
 * 
 * [Rest of the documentation remains the same...]
 */
export async function orcaCreateCLMM(
  agent: SolanaAgentKit,
  mintDeploy: PublicKey,
  mintPair: PublicKey,
  initialPrice: Decimal,
  feeTier: keyof typeof FEE_TIERS,
): Promise<string> {
  try {
    let whirlpoolsConfigAddress: PublicKey;
    if (agent.connection.rpcEndpoint.includes("mainnet")) {
      whirlpoolsConfigAddress = new PublicKey(
        "2LecshUwdy9xi7meFgHtFJQNSKk4KdTrcpvaB56dP2NQ",
      );
    } else if (agent.connection.rpcEndpoint.includes("devnet")) {
      whirlpoolsConfigAddress = new PublicKey(
        "FcrweFY1G9HJAHG5inkGB6pKg1HZ6x9UC2WioAfWrGkR",
      );
    } else {
      throw new Error("Unsupported network");
    }

    // Use the adapter pattern consistently
    const orcaWallet = new OrcaWalletAdapter(agent);
    const ctx = WhirlpoolContext.from(
      agent.connection,
      orcaWallet,
      ORCA_WHIRLPOOL_PROGRAM_ID,
    );
    const fetcher = ctx.fetcher;
    const client = buildWhirlpoolClient(ctx);

    const correctTokenOrder = PoolUtil.orderMints(mintDeploy, mintPair).map(
      (addr) => addr.toString(),
    );
    const isCorrectMintOrder = correctTokenOrder[0] === mintDeploy.toString();
    let mintA;
    let mintB;
    if (!isCorrectMintOrder) {
      [mintA, mintB] = [mintPair, mintDeploy];
      initialPrice = new Decimal(1 / initialPrice.toNumber());
    } else {
      [mintA, mintB] = [mintDeploy, mintPair];
    }
    const mintAAccount = await fetcher.getMintInfo(mintA);
    const mintBAccount = await fetcher.getMintInfo(mintB);
    if (mintAAccount === null || mintBAccount === null) {
      throw Error("Mint account not found");
    }

    const tickSpacing = FEE_TIERS[feeTier];
    const initialTick = PriceMath.priceToInitializableTickIndex(
      initialPrice,
      mintAAccount.decimals,
      mintBAccount.decimals,
      tickSpacing,
    );
    const { poolKey, tx: txBuilder } = await client.createPool(
      whirlpoolsConfigAddress,
      mintA,
      mintB,
      tickSpacing,
      initialTick,
      orcaWallet.publicKey, // Use adapter's publicKey
    );

    const txPayload = await txBuilder.build();
    const txPayloadDecompiled = TransactionMessage.decompile(
      (txPayload.transaction as VersionedTransaction).message,
    );
    const instructions = txPayloadDecompiled.instructions;

    const txId = await sendTx(
      agent,
      instructions,
      txPayload.signers as Keypair[],
    );
    return JSON.stringify({
      transactionId: txId,
      whirlpoolAddress: poolKey.toString(),
    });
  } catch (error) {
    throw new Error(`${error}`);
  }
}