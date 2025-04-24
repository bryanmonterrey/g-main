// app/api/generate-tweet/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getServerSession } from "next-auth"
import { getSupabase } from '@/utils/supabase/getDataWhenAuth'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    const { prompt, agentId, model } = requestData

    // Validate request
    if (!prompt || !agentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the NextAuth session
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('Session user:', session.user);
    console.log('Agent ID:', agentId);

    // Get authenticated Supabase client using your utility function
    const supabase = getSupabase(session)

    // First, let's check if the agent exists at all without user_id filter
    const { data: allAgents, error: allAgentsError } = await supabase
      .from('ai_agents')
      .select('id, user_id')
      
    console.log('All agents found:', allAgents);
    
    if (allAgentsError) {
      console.error('Error fetching all agents:', allAgentsError);
    }

    // Now try to get the specific agent
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .maybeSingle() // Use maybeSingle instead of single to avoid the error

    console.log('Agent query result:', agent);
    
    if (agentError) {
      console.error('Agent query error:', agentError);
      return NextResponse.json(
        { error: 'Error querying agent' },
        { status: 500 }
      )
    }
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Verify the agent belongs to the current user
    if (agent.user_id !== session.user.id) {
      console.log('User ID mismatch - Agent user_id:', agent.user_id, 'Session user.id:', session.user.id);
      return NextResponse.json(
        { error: 'Not authorized to access this agent' },
        { status: 403 }
      )
    }

    // Build prompt based on agent settings
    const tweetStyle = agent.settings.tone || 'professional'
    const emotionalState = agent.settings.emotionalState || 'neutral'
    const topics = agent.settings.topics || ['general']
    
    // Add personality traits with defaults if not present
    const technical_depth = agent.settings.technical_depth || 5
    const provocative_tendency = agent.settings.provocative_tendency || 5
    const chaos_threshold = agent.settings.chaos_threshold || 5
    const philosophical_inclination = agent.settings.philosophical_inclination || 5
    const meme_affinity = agent.settings.meme_affinity || 5

    // Create AI prompt
    let systemPrompt = `Generate a tweet about "${prompt}" in a ${tweetStyle} style.
    
Emotional state: ${emotionalState}
Technical depth (1-10): ${technical_depth}
Provocative tendency (1-10): ${provocative_tendency}
Chaos threshold (1-10): ${chaos_threshold}
Philosophical inclination (1-10): ${philosophical_inclination}
Meme affinity (1-10): ${meme_affinity}

The tweet should be related to the following topics: ${topics.join(', ')}.
Keep the tweet under 280 characters.
Write only the tweet text without any additional explanations.`

    // Generate tweet
    let tweet = ''
    
    if (model === 'claude') {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `Generate a tweet about: ${prompt}` }
        ]
      })
      tweet = response.content[0].text.trim()
    } else {
      // Default to OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a tweet about: ${prompt}` }
        ],
        max_tokens: 300,
      })
      tweet = response.choices[0].message.content?.trim() || ''
    }

    // Ensure the tweet is under 280 characters
    if (tweet.length > 280) {
      tweet = tweet.substring(0, 277) + '...'
    }

    return NextResponse.json({ tweet })
  } catch (error) {
    console.error('Generate tweet error:', error)
    return NextResponse.json(
      { error: 'Failed to generate tweet' },
      { status: 500 }
    )
  }
}