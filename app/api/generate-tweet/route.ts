// app/api/generate-tweet/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getSupabase } from '@/utils/supabase/supabase';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { prompt, agentId, model = 'openai' } = await request.json();

    // Fetch agent settings and user API keys
    const [{ data: agent }, { data: apiKeys }] = await Promise.all([
      supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .eq('user_id', session.user.id)
        .single(),
      supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
    ]);

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (!apiKeys) {
      return NextResponse.json({ error: 'API keys not configured' }, { status: 400 });
    }

    let tweetContent = '';
    const systemPrompt = `You are an AI tweet generator. Generate a tweet based on the following settings:
      - Tone: ${agent.settings?.tone || 'professional'}
      - Topics: ${agent.settings?.topics?.join(', ') || 'general'}
      - Maximum length: 280 characters
      Make the tweet engaging, concise, and appropriate for Twitter.`;

    if (model === 'openai' && apiKeys.openai_api_key) {
      const openai = new OpenAI({
        apiKey: apiKeys.openai_api_key,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.7,
      });

      tweetContent = completion.choices[0].message.content?.trim() || '';
    } else if (model === 'claude' && apiKeys.claude_api_key) {
      const anthropic = new Anthropic({
        apiKey: apiKeys.claude_api_key,
      });

      const message = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 100,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });

      tweetContent = message.content[0].text.trim();
    } else {
      return NextResponse.json({ error: 'No valid API key for selected model' }, { status: 400 });
    }

    // Ensure tweet is within Twitter's character limit
    const finalTweet = tweetContent.length > 280 ? tweetContent.substring(0, 277) + '...' : tweetContent;

    return NextResponse.json({ tweet: finalTweet });
  } catch (error) {
    console.error('Error generating tweet:', error);
    return NextResponse.json(
      { error: 'Failed to generate tweet' },
      { status: 500 }
    );
  }
}