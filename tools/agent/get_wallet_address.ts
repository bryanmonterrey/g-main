import { SolanaAgentKit } from "../../agent";

/**
 * Get the agent's wallet address
 * @param agent - SolanaAgentKit instance
 * @returns string - Base58 encoded public key
 */
export function get_wallet_address(agent: SolanaAgentKit) {
  return agent.publicKey.toBase58();
}