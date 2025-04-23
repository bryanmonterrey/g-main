// app/api/send-tweet/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { getSupabase } from '@/utils/supabase/supabase';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { tweet, agentId } = await request.json();

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

    if (!apiKeys?.twitter_api_key || !apiKeys?.twitter_api_secret || 
        !apiKeys?.twitter_access_token || !apiKeys?.twitter_access_secret) {
      return NextResponse.json({ error: 'Twitter credentials not configured' }, { status: 400 });
    }

    const twitterClient = new TwitterApi({
      appKey: apiKeys.twitter_api_key,
      appSecret: apiKeys.twitter_api_secret,
      accessToken: apiKeys.twitter_access_token,
      accessSecret: apiKeys.twitter_access_secret,
    });

    // Send tweet
    const tweeted = await twitterClient.v2.tweet(tweet);

    // Update agent's last tweet timestamp
    await supabase
      .from('ai_agents')
      .update({ 
        last_tweet_at: new Date().toISOString(),
        performance_metrics: {
          ...agent.performance_metrics,
          total_tweets: (agent.performance_metrics?.total_tweets || 0) + 1
        }
      })
      .eq('id', agentId);

    // Log the tweet in your database
    await supabase
      .from('posts')
      .insert({
        content: tweet,
        user_id: session.user.id,
        type: 'text',
        created_at: new Date().toISOString(),
        metadata: {
          source: 'ai_agent',
          agent_id: agentId,
          twitter_tweet_id: tweeted.data.id
        }
      });

    return NextResponse.json({ 
      success: true, 
      tweet_id: tweeted.data.id 
    });
  } catch (error) {
    console.error('Error sending tweet:', error);
    return NextResponse.json(
      { error: 'Failed to send tweet' },
      { status: 500 }
    );
  }
}