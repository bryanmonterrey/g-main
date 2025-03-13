// lib/light-protocol-service.ts
import { PublicKey, ComputeBudgetProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import {
  LightSystemProgram,
  bn,
  defaultTestStateTreeAccounts,
  selectMinCompressedSolAccountsForTransfer,
  createRpc,
} from '@lightprotocol/stateless.js';

// Use your own RPC URL or environment variable
const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || '';

/**
 * Check a wallet's private balance
 * @param address Wallet address to check
 * @returns Private balance in SOL (formatted to 4 decimal places)
 */
export const checkPrivateBalance = async (address: string): Promise<string | null> => {
  if (!address) return null;
  try {
    const connection = await createRpc(RPC_URL);
    const compressedAccounts = await connection.getCompressedAccountsByOwner(new PublicKey(address));
    const totalLamports = compressedAccounts.items.reduce((sum, account) => 
      BigInt(sum) + BigInt(account.lamports || 0), BigInt(0));
    // Convert lamports to SOL with proper decimal handling
    const solBalance = Number(totalLamports) / 1e9;
    return solBalance.toFixed(4);
  } catch (err) {
    console.error('Error checking private balance:', err);
    return null;
  }
};

interface PrivateTransferOptions {
  amount: number;
  recipientAddress: string;
  wallet: any; // Connected wallet with publicKey and sendTransaction
}

/**
 * Send SOL privately using Light Protocol
 * @param options Transfer options
 * @returns Transaction signature
 */
export const sendPrivateTransaction = async (options: PrivateTransferOptions): Promise<{
  signature: string;
  recipientPrivateBalance: string | null;
  senderPrivateBalance: string | null;
}> => {
  const { amount, recipientAddress, wallet } = options;
  const { publicKey, sendTransaction } = wallet;

  if (!publicKey) {
    throw new Error('Wallet not connected');
  }

  const connection = await createRpc(RPC_URL);
  const recipientPubKey = new PublicKey(recipientAddress);
  const lamportsAmount = Math.floor(amount * 1e9);

  // Step 1: Compress SOL from the sender's regular wallet
  console.log('Compressing SOL...');
  const compressInstruction = await LightSystemProgram.compress({
    payer: publicKey,
    toAddress: publicKey,
    lamports: lamportsAmount,
    outputStateTree: defaultTestStateTreeAccounts().merkleTree,
  });

  const compressInstructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
    compressInstruction,
  ];

  console.log('Getting blockhash...');
  const { context: { slot: minContextSlot }, value: blockhashCtx } = 
    await connection.getLatestBlockhashAndContext();

  const messageV0 = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: blockhashCtx.blockhash,
    instructions: compressInstructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);

  console.log('Sending compression transaction...');
  const compressionSignature = await sendTransaction(transaction, connection, {
    minContextSlot,
  });

  await connection.confirmTransaction({
    signature: compressionSignature,
    ...blockhashCtx
  });

  // Step 2: Send compressed SOL privately to recipient
  console.log('Getting compressed accounts...');
  const accounts = await connection.getCompressedAccountsByOwner(publicKey);

  const [selectedAccounts, _] = selectMinCompressedSolAccountsForTransfer(
    accounts.items,
    lamportsAmount
  );

  console.log('Getting validity proof...');
  const { compressedProof, rootIndices } = await connection.getValidityProof(
    selectedAccounts.map(account => bn(account.hash))
  );

  console.log('Creating private transfer...');
  const sendInstruction = await LightSystemProgram.transfer({
    payer: publicKey,
    toAddress: recipientPubKey,
    lamports: lamportsAmount,
    inputCompressedAccounts: selectedAccounts,
    outputStateTrees: [defaultTestStateTreeAccounts().merkleTree],
    recentValidityProof: compressedProof,
    recentInputStateRootIndices: rootIndices,
  });

  const sendInstructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
    sendInstruction,
  ];

  const { context: { slot: minContextSlotSend }, value: blockhashSend } = 
    await connection.getLatestBlockhashAndContext();

  const messageV0Send = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: blockhashSend.blockhash,
    instructions: sendInstructions,
  }).compileToV0Message();

  const transactionSend = new VersionedTransaction(messageV0Send);

  console.log('Sending private transfer...');
  const signature = await sendTransaction(transactionSend, connection, {
    minContextSlot: minContextSlotSend,
  });

  await connection.confirmTransaction({
    signature,
    ...blockhashSend
  });

  // Check recipient's and sender's private balances after transfer
  const recipientPrivateBalance = await checkPrivateBalance(recipientAddress);
  const senderPrivateBalance = await checkPrivateBalance(publicKey.toString());
  
  return {
    signature,
    recipientPrivateBalance,
    senderPrivateBalance
  };
};

/**
 * Unshield (convert private SOL back to normal SOL)
 */
export const unshieldSol = async (amount: number, wallet: any): Promise<string> => {
  const { publicKey, sendTransaction } = wallet;
  
  if (!publicKey) {
    throw new Error('Wallet not connected');
  }

  const connection = await createRpc(RPC_URL);
  const lamportsAmount = Math.floor(amount * 1e9);

  console.log('Getting compressed accounts...');
  const accounts = await connection.getCompressedAccountsByOwner(publicKey);

  const [selectedAccounts, _] = selectMinCompressedSolAccountsForTransfer(
    accounts.items,
    lamportsAmount
  );

  console.log('Getting validity proof...');
  const { compressedProof, rootIndices } = await connection.getValidityProof(
    selectedAccounts.map(account => bn(account.hash))
  );

  console.log('Creating unshield transaction...');
  const unshieldInstruction = await LightSystemProgram.decompress({
    payer: publicKey,
    toAddress: publicKey,
    lamports: lamportsAmount,
    inputCompressedAccounts: selectedAccounts,
    recentValidityProof: compressedProof,
    recentInputStateRootIndices: rootIndices,
  });

  const unshieldInstructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
    unshieldInstruction,
  ];

  const { context: { slot: minContextSlot }, value: blockhashCtx } = 
    await connection.getLatestBlockhashAndContext();

  const messageV0 = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: blockhashCtx.blockhash,
    instructions: unshieldInstructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);

  console.log('Sending unshield transaction...');
  const signature = await sendTransaction(transaction, connection, {
    minContextSlot,
  });

  await connection.confirmTransaction({
    signature,
    ...blockhashCtx
  });

  return signature;
};