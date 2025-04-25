// app/api/create-agent/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getSupabase } from '@/utils/supabase/getDataWhenAuth'

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    const { name, settings } = requestData

    if (!name) {
      return NextResponse.json(
        { error: 'Missing agent name' },
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

    // Get authenticated Supabase client using your utility function
    const supabase = getSupabase(session)

    // Default agent settings
    const defaultSettings = {
      tone: 'professional',
      topics: ['ai', 'technology', 'business'],
      tweet_frequency: 1,
      engagement_enabled: false,
      emotionalState: 'neutral',
      technical_depth: 5,
      provocative_tendency: 5,
      chaos_threshold: 5,
      philosophical_inclination: 5,
      meme_affinity: 5
    }

    // Default performance metrics
    const defaultMetrics = {
      total_tweets: 0,
      total_likes: 0,
      total_retweets: 0,
      avg_engagement_rate: 0
    }

    // Create new agent
    const now = new Date().toISOString()
    const { data: newAgent, error: createError } = await supabase
      .from('ai_agents')
      .insert({
        user_id: session.user.id,
        name: name,
        status: 'inactive',
        mode: 'manual',
        settings: settings || defaultSettings,
        performance_metrics: defaultMetrics,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    if (createError) {
      console.error('Agent creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to create agent' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, agent: newAgent })
  } catch (error) {
    console.error('Create agent error:', error)
    return NextResponse.json(
      { error: 'Failed to create agent: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}