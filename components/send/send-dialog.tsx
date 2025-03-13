// components/send/send-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Shield, Info } from "lucide-react";
import { shortenWalletAddress } from "@/lib/functions";
import { getSolBalance, sendSolana } from "@/lib/solana-service";
import { sendPrivateTransaction, checkPrivateBalance } from "@/lib/light-protocol-service";

// Fee calculation constants - keep in sync with solana-service.ts
const FEE_RATES = {
  slow: 0.005, // 0.5%
  normal: 0.01, // 1%
  fast: 0.015 // 1.5%
};
const MIN_FEE = 0.005;

interface SendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipientAddress: string;
  recipientUsername: string | null;
}

export const SendDialog = ({ isOpen, onClose, recipientAddress, recipientUsername }: SendDialogProps) => {
  const { data: session } = useSession();
  const wallet = useWallet();
  const [amount, setAmount] = useState("0.1");
  const [isPrivate, setIsPrivate] = useState(false);
  const [fee, setFee] = useState("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feeAmount, setFeeAmount] = useState(0);
  const [recipientAmount, setRecipientAmount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [privateBalance, setPrivateBalance] = useState("0");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [status, setStatus] = useState("");
  
  // Calculate fee amount and recipient amount when inputs change
  useEffect(() => {
    if (!isPrivate) {
      const inputAmount = parseFloat(amount) || 0;
      const feeRate = FEE_RATES[fee as keyof typeof FEE_RATES];
      const calculatedFee = Math.max(inputAmount * feeRate, MIN_FEE);
      const amountAfterFee = Math.max(inputAmount - calculatedFee, 0);
      
      setFeeAmount(calculatedFee);
      setRecipientAmount(amountAfterFee);
    } else {
      // No service fee for private transactions (Light Protocol has its own fees)
      setFeeAmount(0);
      setRecipientAmount(parseFloat(amount) || 0);
    }
  }, [amount, fee, isPrivate]);
  
  // Fetch wallet balance when connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet && wallet.connected && wallet.publicKey) {
        setLoadingBalance(true);
        try {
          // Get regular SOL balance
          const balance = await getSolBalance(wallet);
          setWalletBalance(balance);
          
          // Get private balance if needed
          if (isPrivate) {
            const privBalance = await checkPrivateBalance(wallet.publicKey.toString());
            setPrivateBalance(privBalance || "0");
          }
        } catch (error) {
          console.error("Error fetching balance:", error);
        } finally {
          setLoadingBalance(false);
        }
      } else {
        setWalletBalance(0);
        setPrivateBalance("0");
      }
    };
    
    if (isOpen) {
      fetchBalance();
    }
  }, [wallet, wallet.connected, wallet.publicKey, isOpen, isPrivate]);

  // Handle the form submission
  const handleSend = async () => {
    if (!session?.user) {
      toast.error("You must be logged in to send SOL");
      return;
    }
    
    if (!wallet || !wallet.connected || !wallet.publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Validate the amount
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
      
      // For non-private transactions, check if amount is greater than fee
      if (!isPrivate && parsedAmount <= feeAmount) {
        toast.error(`Amount must be greater than the fee (${feeAmount.toFixed(5)} SOL)`);
        return;
      }
      
      // Check if user has enough balance
      if (parsedAmount > walletBalance) {
        toast.error(`Insufficient balance. You have ${walletBalance.toFixed(5)} SOL available.`);
        return;
      }
      
      // Use appropriate transaction method based on privacy setting
      if (isPrivate) {
        // Show status updates for private transactions
        const statusToast = toast.loading("Preparing private transaction...");
        
        setStatus("Compressing SOL...");
        toast.loading("Compressing SOL...", { id: statusToast });
        
        // Send the private transaction
        const { signature, recipientPrivateBalance, senderPrivateBalance } = await sendPrivateTransaction({
          amount: parsedAmount,
          recipientAddress,
          wallet,
        });
        
        // Update private balance after transaction
        setPrivateBalance(senderPrivateBalance || "0");
        
        toast.success(
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-1 text-green-400" />
              <p>Privately sent {parsedAmount.toFixed(5)} SOL to {recipientUsername || shortenWalletAddress(recipientAddress)}</p>
            </div>
            <a 
              href={`https://explorer.solana.com/tx/${signature}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline text-sm"
            >
              View transaction
            </a>
            {recipientPrivateBalance && (
              <p className="text-sm text-green-400">
                Recipient's private balance: {recipientPrivateBalance} SOL
              </p>
            )}
          </div>,
          { id: statusToast, duration: 6000 }
        );
      } else {
        // Regular transaction
        const signature = await sendSolana({
          amount: parsedAmount,
          recipientAddress,
          isPrivate: false,
          fee: fee as 'slow' | 'normal' | 'fast',
          wallet
        });
        
        // Update balance after transaction
        const newBalance = await getSolBalance(wallet);
        setWalletBalance(newBalance);
        
        toast.success(
          <div className="flex flex-col gap-2">
            <p>Successfully sent {recipientAmount.toFixed(5)} SOL to {recipientUsername || shortenWalletAddress(recipientAddress)}</p>
            <a 
              href={`https://explorer.solana.com/tx/${signature}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline text-sm"
            >
              View transaction
            </a>
          </div>,
          { duration: 6000 }
        );
      }
      
      onClose();
    } catch (error) {
      console.error(`Error sending SOL ${isPrivate ? 'privately' : ''}:`, error);
      let errorMessage = `Failed to send SOL${isPrivate ? ' privately' : ''}`;
      
      // Extract wallet error message if available
      if (error instanceof Error) {
        // Handle wallet adapter errors which often have nested error objects
        const walletError = (error as any).error || error;
        errorMessage = walletError.message || error.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setStatus("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Send SOL
            {isPrivate && (
              <Shield className="ml-2 h-4 w-4 text-green-400" />
            )}
          </DialogTitle>
          <DialogDescription>
            Send SOL to {recipientUsername || shortenWalletAddress(recipientAddress)}
          </DialogDescription>
        </DialogHeader>
        
        {/* Wallet Status */}
        <div className="p-3 bg-slate-800/50 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-300">Wallet:</span>
            <span className="text-sm font-medium">
              {wallet.connected ? 
                shortenWalletAddress(wallet.publicKey?.toString() || '') :
                <span className="text-orange-400">Not connected</span>
              }
            </span>
          </div>
          {wallet.connected && (
            <>
              <div className="flex justify-between mt-1">
                <span className="text-sm text-slate-300">SOL Balance:</span>
                <span className="text-sm font-medium">
                  {loadingBalance ? (
                    <Loader2 className="h-4 w-4 animate-spin inline-block" />
                  ) : (
                    `${walletBalance.toFixed(5)} SOL`
                  )}
                </span>
              </div>
              {isPrivate && (
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-slate-300">Private Balance:</span>
                  <span className="text-sm font-medium text-green-400">
                    {loadingBalance ? (
                      <Loader2 className="h-4 w-4 animate-spin inline-block" />
                    ) : (
                      `${privateBalance} SOL`
                    )}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.005"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-2"
              />
              <span>SOL</span>
            </div>
          </div>
          
          {/* Only show fee selection for non-private transactions */}
          {!isPrivate && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fee" className="text-right">
                Speed
              </Label>
              <Select value={fee} onValueChange={setFee}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select transaction speed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Slow (0.5% fee)</SelectItem>
                  <SelectItem value="normal">Normal (1% fee)</SelectItem>
                  <SelectItem value="fast">Fast (1.5% fee)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="private" className="text-right">
              Private
            </Label>
            <div className="flex items-center space-x-2 col-span-3">
              <Checkbox
                id="private"
                checked={isPrivate}
                onCheckedChange={(checked) => setIsPrivate(!!checked)}
                disabled={isSubmitting}
              />
              <div className="flex items-center">
                <Label htmlFor="private" className="font-normal">
                  Make this transaction private
                </Label>
                <div className="relative group ml-1">
                  <Info className="h-4 w-4 text-gray-400" />
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-slate-800 p-2 rounded shadow-lg text-xs w-48 z-10">
                    Private transactions use Light Protocol to shield your SOL, making it untraceable on the blockchain.
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Fee summary section - only show for non-private transactions */}
          {!isPrivate ? (
            <div className="mt-2 p-3 bg-slate-800/50 rounded-md">
              <h4 className="text-sm font-medium mb-2">Transaction Summary</h4>
              <div className="grid grid-cols-2 text-sm">
                <p className="text-slate-300">You send:</p>
                <p className="text-right">{parseFloat(amount) || 0} SOL</p>
                
                <p className="text-slate-300">Service fee:</p>
                <p className="text-right">{feeAmount.toFixed(5)} SOL ({(FEE_RATES[fee as keyof typeof FEE_RATES] * 100).toFixed(1)}%)</p>
                
                <p className="text-slate-300 mt-1">Recipient gets:</p>
                <p className="text-right mt-1 font-medium">{recipientAmount.toFixed(5)} SOL</p>
              </div>
            </div>
          ) : (
            <div className="mt-2 p-3 bg-green-900/20 rounded-md">
              <h4 className="text-sm font-medium flex items-center mb-2">
                <Shield className="h-4 w-4 mr-1" />
                Private Transaction
              </h4>
              <p className="text-xs text-slate-300">
                Your transaction will be private using Light Protocol. This means:
              </p>
              <ul className="text-xs text-slate-300 mt-1 ml-4 list-disc">
                <li>The transaction will be shielded on the blockchain</li>
                <li>The relationship between sender and recipient is private</li>
                <li>The amount sent is completely confidential</li>
              </ul>
              <p className="text-xs text-slate-300 mt-1">
                <strong>Note:</strong> Private transactions involve multiple steps and may take longer to complete.
              </p>
            </div>
          )}
          
          {/* Status display for private transactions */}
          {isPrivate && status && (
            <div className="mt-2 p-3 bg-blue-900/20 rounded-md">
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <p className="text-sm">{status}</p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" className="bg-slate-800/50 hover:bg-slate-800/70 rounded-full border-none" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={
              isSubmitting || 
              !wallet.connected || 
              parseFloat(amount) <= 0 || 
              (!isPrivate && parseFloat(amount) <= feeAmount) ||
              parseFloat(amount) > walletBalance
            }
            className={isPrivate ? "bg-green-900 hover:bg-green-800 rounded-full" : "bg-slate-800/50 hover:bg-slate-800/70 rounded-full"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isPrivate ? "Processing..." : "Sending..."}
              </>
            ) : (
              isPrivate ? "Send Privately" : "Send SOL"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};