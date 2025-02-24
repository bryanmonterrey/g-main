import { SolanaAgentKit } from "../../agent";
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  WhirlpoolContext,
  buildWhirlpoolClient,
  getAllPositionAccountsByOwner,
  PriceMath,
} from "@orca-so/whirlpools-sdk";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

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

interface PositionInfo {
  whirlpoolAddress: string;
  positionInRange: boolean;
  distanceFromCenterBps: number;
}

type PositionDataMap = {
  [positionMintAddress: string]: PositionInfo;
};

export async function orcaFetchPositions(
  agent: SolanaAgentKit,
): Promise<string> {
  try {
    // Use the same adapter pattern
    const orcaWallet = new OrcaWalletAdapter(agent);

    const ctx = WhirlpoolContext.from(
      agent.connection,
      orcaWallet,
      ORCA_WHIRLPOOL_PROGRAM_ID,
    );
    const client = buildWhirlpoolClient(ctx);

    const positions = await getAllPositionAccountsByOwner({
      ctx,
      owner: agent.publicKey,
    });

    const positionDatas = [
      ...positions.positions.entries(),
      ...positions.positionsWithTokenExtensions.entries(),
    ];

    const result: PositionDataMap = {};
    for (const [, positionData] of positionDatas) {
      // Rest of the position processing remains the same
      const positionMintAddress = positionData.positionMint;
      const whirlpoolAddress = positionData.whirlpool;
      const whirlpool = await client.getPool(whirlpoolAddress);
      const whirlpoolData = whirlpool.getData();
      const sqrtPrice = whirlpoolData.sqrtPrice;
      const currentTick = whirlpoolData.tickCurrentIndex;
      const mintA = whirlpool.getTokenAInfo();
      const mintB = whirlpool.getTokenBInfo();
      const currentPrice = PriceMath.sqrtPriceX64ToPrice(
        sqrtPrice,
        mintA.decimals,
        mintB.decimals,
      );
      const lowerTick = positionData.tickLowerIndex;
      const upperTick = positionData.tickUpperIndex;
      const lowerPrice = PriceMath.tickIndexToPrice(
        lowerTick,
        mintA.decimals,
        mintB.decimals,
      );
      const upperPrice = PriceMath.tickIndexToPrice(
        upperTick,
        mintA.decimals,
        mintB.decimals,
      );
      const centerPosition = lowerPrice.add(upperPrice).div(2);

      const positionInRange =
        currentTick > lowerTick && currentTick < upperTick ? true : false;
      const distanceFromCenterBps = Math.ceil(
        currentPrice
          .sub(centerPosition)
          .abs()
          .div(centerPosition)
          .mul(10000)
          .toNumber(),
      );

      result[positionMintAddress.toString()] = {
        whirlpoolAddress: whirlpoolAddress.toString(),
        positionInRange,
        distanceFromCenterBps,
      };
    }
    return JSON.stringify(result);
  } catch (error) {
    throw new Error(`${error}`);
  }
}