import { NextRequest, NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { getAgent } from "@/lib/solana-agent";
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Validate API KEY
    const headersInstance = await headers();
    const authorization = headersInstance.get('authorization');
    if (!authorization || authorization !== process.env.API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, modelName, walletPublicKey } = await req.json();
    
    if (!walletPublicKey) {
      return NextResponse.json({ error: "Wallet not connected" }, { status: 401 });
    }

    const walletContext = {
      publicKey: walletPublicKey,
      // Add other required wallet context properties
    };

    const { agent, config } = await getAgent(modelName, walletContext);

    const messages = [
      new HumanMessage({
        content: message
      })
    ];

    const stream = await agent.stream({ messages }, config);

    let response = "";

    for await (const chunk of stream) {
      if ("agent" in chunk) {
        // console.log("chunk.agent", chunk.agent);
        response += chunk.agent.messages[0].content + "\n";
      } else if ("tools" in chunk) {
        // console.log("chunk.tools", chunk.tools);
        console.log(chunk.tools.messages[0].content);
      }
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}