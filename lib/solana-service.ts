// lib/solana-service.ts
import { 
    Connection, 
    PublicKey, 
    Transaction, 
    SystemProgram, 
    LAMPORTS_PER_SOL
  } from '@solana/web3.js';
  
  interface TransactionOptions {
    amount: number;
    recipientAddress: string;
    isPrivate: boolean;
    fee: 'slow' | 'normal' | 'fast';
    wallet: any; // This is the connected wallet from your wallet-adapter
  }
  
  // Your fee wallet address from environment variable
  const FEE_WALLET_ADDRESS = process.env.NEXT_PUBLIC_FEE_WALLET_ADDRESS || "";
  
  // Fee structure based on transaction speed
  const FEE_RATES = {
    slow: 0.005, // 0.5%
    normal: 0.01, // 1%
    fast: 0.015 // 1.5%
  };
  
  // Minimum fee amount in SOL
  const MIN_FEE = 0.005;
  
  // Connection commitment levels based on speed
  const COMMITMENT_LEVELS = {
    slow: 'confirmed',
    normal: 'finalized',
    fast: 'processed'
  };
  
  /**
   * Calculate the fee amount based on the transaction amount and fee type
   */
  const calculateFee = (amount: number, feeType: 'slow' | 'normal' | 'fast'): number => {
    const calculatedFee = amount * FEE_RATES[feeType];
    return Math.max(calculatedFee, MIN_FEE); // Ensure minimum fee
  };
  
  /**
   * Convert SOL to lamports
   */
  const solToLamports = (sol: number): number => {
    return Math.floor(sol * LAMPORTS_PER_SOL);
  };
  
  /**
   * Send SOL with a service fee
   */
  export const sendSolana = async (options: TransactionOptions): Promise<string> => {
    const { amount, recipientAddress, isPrivate, fee, wallet } = options;
    
    // Check wallet connection
    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }
    
    // Validate fee wallet address
    if (!FEE_WALLET_ADDRESS) {
      console.warn("Fee wallet address not configured. Set NEXT_PUBLIC_FEE_WALLET_ADDRESS in your environment variables.");
    }
    
    // Calculate the fee amount
    const feeAmount = calculateFee(amount, fee);
    const amountAfterFee = amount - feeAmount;
    
    // Convert to lamports
    const recipientLamports = solToLamports(amountAfterFee);
    const feeLamports = solToLamports(feeAmount);
    
    try {
      // Connect to Solana network - use existing RPC endpoint from your wallet connection
      const connection = new Connection(
        process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com',
        COMMITMENT_LEVELS[fee] as any
      );
      
      // Create transaction
      const transaction = new Transaction();
      
      // Add instruction to send SOL to recipient
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(recipientAddress),
          lamports: recipientLamports
        })
      );
      
      // Add instruction to send fee to service wallet if configured
      if (FEE_WALLET_ADDRESS) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey(FEE_WALLET_ADDRESS),
            lamports: feeLamports
          })
        );
      }
      
      // Set recent blockhash
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      
      // Set transaction fee payer
      transaction.feePayer = wallet.publicKey;
      
      // Sign transaction - wallet adapter will handle this via popup
      const signed = await wallet.signTransaction(transaction);
      
      // Send and confirm transaction
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, COMMITMENT_LEVELS[fee] as any);
      
      console.log(`Transaction details:`);
      console.log(`- Signature: ${signature}`);
      console.log(`- Total amount: ${amount} SOL`);
      console.log(`- Fee (${fee}): ${feeAmount} SOL`);
      console.log(`- Amount to recipient: ${amountAfterFee} SOL`);
      console.log(`- Recipient address: ${recipientAddress}`);
      console.log(`- Fee recipient: ${FEE_WALLET_ADDRESS || "Not configured"}`);
      
      return signature;
    } catch (error) {
      console.error("Solana transaction error:", error);
      throw error;
    }
  };
  
  /**
   * Get SOL balance for a wallet
   */
  export const getSolBalance = async (wallet: any): Promise<number> => {
    if (!wallet || !wallet.publicKey) {
      return 0;
    }
    
    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com'
      );
      
      const balance = await connection.getBalance(wallet.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error("Error getting SOL balance:", error);
      return 0;
    }
  };