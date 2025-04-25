// app/api/send-tweet/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getSupabase } from '@/utils/supabase/getDataWhenAuth'

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    const { tweet, agentId } = requestData

    // Validate request
    if (!tweet || !agentId) {
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

    // Get authenticated Supabase client using your utility function
    const supabase = getSupabase(session)

    // Get the agent
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .maybeSingle()

    if (agentError) {
      console.error('Agent query error:', agentError)
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

    // Store the tweet in the posts table
    const { error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: session.user.id,
        content: tweet,
        type: 'tweet',
        metadata: {
          agent_id: agentId,
          twitter_status: 'pending' // You could implement actual Twitter posting later
        }
      })

    if (postError) {
      console.error('Post creation error:', postError)
      return NextResponse.json(
        { error: 'Failed to save tweet' },
        { status: 500 }
      )
    }

    // Update agent's stats
    const now = new Date().toISOString()
    const newTweetCount = (agent.performance_metrics?.total_tweets || 0) + 1
    
    const { error: updateError } = await supabase
      .from('ai_agents')
      .update({
        last_tweet_at: now,
        performance_metrics: {
          ...agent.performance_metrics,
          total_tweets: newTweetCount
        },
        updated_at: now
      })
      .eq('id', agentId)

    if (updateError) {
      console.error('Agent update error:', updateError)
      // We don't need to return an error here as the tweet was saved
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send tweet error:', error)
    return NextResponse.json(
      { error: 'Failed to send tweet: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}