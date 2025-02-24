import {
  Keypair,
  PublicKey,
  TransactionInstruction,
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
  buildWhirlpoolClient,
  increaseLiquidityQuoteByInputToken,
  TokenExtensionContextForPool,
  NO_TOKEN_EXTENSION_CONTEXT,
} from "@orca-so/whirlpools-sdk";

import { sendTx } from "../../utils/send_tx";
import { Percentage } from "@orca-so/common-sdk";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

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
 * # Opens a Centered Liquidity Position in an Orca Whirlpool
 * 
 * [Rest of the documentation remains the same...]
 */
export async function orcaOpenCenteredPositionWithLiquidity(
  agent: SolanaAgentKit,
  whirlpoolAddress: PublicKey,
  priceOffsetBps: number,
  inputTokenMint: PublicKey,
  inputAmount: Decimal,
): Promise<string> {
  try {
    // Use the adapter pattern consistently
    const orcaWallet = new OrcaWalletAdapter(agent);
    const ctx = WhirlpoolContext.from(
      agent.connection,
      orcaWallet,
      ORCA_WHIRLPOOL_PROGRAM_ID,
    );
    const client = buildWhirlpoolClient(ctx);

    const whirlpool = await client.getPool(whirlpoolAddress);
    const whirlpoolData = whirlpool.getData();
    const mintInfoA = whirlpool.getTokenAInfo();
    const mintInfoB = whirlpool.getTokenBInfo();
    const price = PriceMath.sqrtPriceX64ToPrice(
      whirlpoolData.sqrtPrice,
      mintInfoA.decimals,
      mintInfoB.decimals,
    );

    const lowerPrice = price.mul(1 - priceOffsetBps / 10000);
    const upperPrice = price.mul(1 + priceOffsetBps / 10000);
    const lowerTick = PriceMath.priceToInitializableTickIndex(
      lowerPrice,
      mintInfoA.decimals,
      mintInfoB.decimals,
      whirlpoolData.tickSpacing,
    );
    const upperTick = PriceMath.priceToInitializableTickIndex(
      upperPrice,
      mintInfoA.decimals,
      mintInfoB.decimals,
      whirlpoolData.tickSpacing,
    );

    const txBuilderTickArrays = await whirlpool.initTickArrayForTicks([
      lowerTick,
      upperTick,
    ]);
    let instructions: TransactionInstruction[] = [];
    let signers: Keypair[] = [];
    if (txBuilderTickArrays !== null) {
      const txPayloadTickArrays = await txBuilderTickArrays.build();
      const txPayloadTickArraysDecompiled = TransactionMessage.decompile(
        (txPayloadTickArrays.transaction as VersionedTransaction).message,
      );
      const instructionsTickArrays = txPayloadTickArraysDecompiled.instructions;
      instructions = instructions.concat(instructionsTickArrays);
      signers = signers.concat(txPayloadTickArrays.signers as Keypair[]);
    }

    const tokenExtensionCtx: TokenExtensionContextForPool = {
      ...NO_TOKEN_EXTENSION_CONTEXT,
      tokenMintWithProgramA: mintInfoA,
      tokenMintWithProgramB: mintInfoB,
    };
    const increaseLiquiditQuote = increaseLiquidityQuoteByInputToken(
      inputTokenMint,
      inputAmount,
      lowerTick,
      upperTick,
      Percentage.fromFraction(1, 100),
      whirlpool,
      tokenExtensionCtx,
    );
    const { positionMint, tx: txBuilder } =
      await whirlpool.openPositionWithMetadata(
        lowerTick,
        upperTick,
        increaseLiquiditQuote,
        undefined,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );

    const txPayload = await txBuilder.build();
    const txPayloadDecompiled = TransactionMessage.decompile(
      (txPayload.transaction as VersionedTransaction).message,
    );
    instructions = instructions.concat(txPayloadDecompiled.instructions);
    signers = signers.concat(txPayload.signers as Keypair[]);

    const txId = await sendTx(agent, instructions, signers);
    return JSON.stringify({
      transactionId: txId,
      positionMint: positionMint.toString(),
    });
  } catch (error) {
    throw new Error(`${error}`);
  }
}