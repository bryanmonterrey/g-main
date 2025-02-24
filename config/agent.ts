import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { validateEnvironment } from "@/lib/utils";
import { ChatDeepSeek } from "@langchain/deepseek";
import { SolanaAgentKit } from "@/agent"; // Changed this import
import { WalletContextState } from "@solana/wallet-adapter-react";

export async function initializeAgent(
  modelName: string,
  wallet: WalletContextState
) {
  validateEnvironment();

  const llm = modelName?.includes("OpenAI")
    ? new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0.3,
        apiKey: process.env.OPENAI_API_KEY!,
      })
    : modelName?.includes("Claude")
    ? new ChatAnthropic({
        modelName: "claude-3-opus-20240229",
        temperature: 0.3,
        apiKey: process.env.ANTHROPIC_API_KEY!,
      })
    : new ChatDeepSeek({
        model: "deepseek-chat",
        temperature: 0,
        apiKey: process.env.DEEPSEEK_API_KEY!,
      });

  validateEnvironment();
  console.log("llm", llm);

  // Updated to use our new SolanaAgentKit
  const solanaAgent = new SolanaAgentKit(
    wallet,
    process.env.RPC_URL!,
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    }
  );

  const tools = createSolanaTools(solanaAgent);
  const memory = new MemorySaver();
  const config = { configurable: { thread_id: "1" } };

  const agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: memory,
    messageModifier: `
        You are the link between the user and the Solana Agent Kit. You are empowered to interact onchain using your tools from the Solana Agent Kit. If you ever need funds, you can request them from the
        faucet. If not, you can provide your wallet details and request funds from the user. If there is a 5XX
        (internal) HTTP error code, ask the user to try again later. If someone asks you to do something you
        can't do with your currently available tools, you must say so, and encourage them to implement it
        themselves using the Solana Agent Kit, recommend they go to https://www.solanaagentkit.xyz for more information. Be
        concise and helpful with your responses. Refrain from restating your tools' descriptions unless it is explicitly requested.
      `,
  });

  return { agent, config };
}