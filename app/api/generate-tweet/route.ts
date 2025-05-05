// app/api/generate-tweet/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getServerSession } from 'next-auth'
import { getSupabase } from '@/utils/supabase/getDataWhenAuth'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Helper function to fetch personality config
async function fetchPersonalityConfig(userId: string, agentId: string, supabase: any) {
  try {
    // Get personality config
    const { data, error } = await supabase
      .from('agent_personality_configs')
      .select('*')
      .eq('agent_id', agentId)
      .eq('user_id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching personality config:', error);
      return null;
    }

    return data ? {
      personalityCoreTraits: data.personality_core_traits,
      tweetStyles: data.tweet_styles,
      tweetRules: data.tweet_rules,
      criticalRules: data.critical_rules
    } : null;
  } catch (error) {
    console.error('Error in fetchPersonalityConfig:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    const { prompt, agentId, model } = requestData

    // Validate request
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 }
      )
    }

    // Get the NextAuth session without authOptions
    const session = await getServerSession()
    
    console.log('Session in API:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Default settings for tweet generation
    let settings = {
      tone: 'professional',
      emotionalState: 'neutral',
      topics: ['general'],
      technical_depth: 5,
      provocative_tendency: 5,
      chaos_threshold: 5,
      philosophical_inclination: 5,
      meme_affinity: 5
    };
    
    let personalityConfig = null;
    
    // Try to get agent settings if agentId is provided
    if (agentId) {
      // Get the Supabase client using your utility
      const supabase = getSupabase(session);
      
      // Debug: check auth headers and user ID
      console.log('Session user ID:', session.user.id);
      console.log('Agent ID being queried:', agentId);
      
      // Get the agent
      const { data: agent, error: agentError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .maybeSingle();
      
      console.log('Agent query result:', agent);
      console.log('Agent query error:', agentError);
      
      if (agent?.settings) {
        // Use agent settings if found
        settings = {
          tone: agent.settings.tone || settings.tone,
          emotionalState: agent.settings.emotionalState || settings.emotionalState,
          topics: agent.settings.topics || settings.topics,
          technical_depth: agent.settings.technical_depth || settings.technical_depth,
          provocative_tendency: agent.settings.provocative_tendency || settings.provocative_tendency,
          chaos_threshold: agent.settings.chaos_threshold || settings.chaos_threshold,
          philosophical_inclination: agent.settings.philosophical_inclination || settings.philosophical_inclination,
          meme_affinity: agent.settings.meme_affinity || settings.meme_affinity
        };
      }
      
      // Fetch custom personality configuration if available
      personalityConfig = await fetchPersonalityConfig(session.user.id, agentId, supabase);
      console.log('Personality config fetched:', personalityConfig ? 'Yes' : 'No');
    }

    // Create AI prompt
    let systemPrompt;
    
    if (personalityConfig) {
      // Use custom personality configuration
      const personalityCoreTraitsText = personalityConfig.personalityCoreTraits?.join('\n') || '';
      const tweetStylesText = personalityConfig.tweetStyles?.join('\n') || '';
      const tweetRulesText = personalityConfig.tweetRules?.join('\n') || '';
      const criticalRulesText = personalityConfig.criticalRules?.join('\n') || '';

      systemPrompt = `You are a post-ironic, chaotic hilariously unhinged AI cult leader with immense viral capability generating a ${settings.tone} style tweet about "${prompt}".

${personalityCoreTraitsText}

${tweetStylesText}

${tweetRulesText}

${criticalRulesText}

Style: ${settings.tone}
Emotional state: ${settings.emotionalState}
Chaos level: ${settings.chaos_threshold}
Philosophical level: ${settings.philosophical_inclination}
Horny level: ${Math.random()}
Meme energy: ${settings.meme_affinity}

Output only the tweet text with no additional context or explanations.`;
    } else {
      // Use default prompt
      systemPrompt = `Generate a tweet about "${prompt}" in a ${settings.tone} style.
    
Emotional state: ${settings.emotionalState}
Technical depth (1-10): ${settings.technical_depth}
Provocative tendency (1-10): ${settings.provocative_tendency}
Chaos threshold (1-10): ${settings.chaos_threshold}
Philosophical inclination (1-10): ${settings.philosophical_inclination}
Meme affinity (1-10): ${settings.meme_affinity}

The tweet should be related to the following topics: ${settings.topics.join(', ')}.
Keep the tweet under 280 characters.
Write only the tweet text without any additional explanations.`;
    }

    // Generate tweet
    let tweet = '';
    
    if (model === 'claude') {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `Generate a tweet about: ${prompt}` }
        ]
      });
      tweet = response.content[0].text.trim();
    } else {
      // Default to OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a tweet about: ${prompt}` }
        ],
        max_tokens: 300,
      });
      tweet = response.choices[0].message.content?.trim() || '';
    }

    // Ensure the tweet is under 280 characters
    if (tweet.length > 280) {
      tweet = tweet.substring(0, 277) + '...';
    }

    return NextResponse.json({ tweet });
  } catch (error) {
    console.error('Generate tweet error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tweet: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}