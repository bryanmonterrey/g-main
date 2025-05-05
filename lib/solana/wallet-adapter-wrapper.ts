export class WalletAdapterWrapper {
  public publicKey: PublicKey;

  constructor(private wallet: WalletContextState, private rpcUrl: string) {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }
    this.publicKey = wallet.publicKey;
  }

  // ... rest of the class implementation
} 