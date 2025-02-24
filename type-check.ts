// type-check.ts
import { SolanaAgentKit } from "@/agent";

// This will show the return type when you hover over DeployTokenReturn
type DeployTokenReturn = ReturnType<typeof SolanaAgentKit.prototype.deployToken>;

// You can also check other methods:
type TransferReturn = ReturnType<typeof SolanaAgentKit.prototype.transfer>;
type GetBalanceReturn = ReturnType<typeof SolanaAgentKit.prototype.getBalance>;

// If you want to see the full interface, you can do:
type AllMethods = typeof SolanaAgentKit.prototype;