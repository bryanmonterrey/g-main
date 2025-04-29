// app/api/send-tweet/route.ts (revised)
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getSupabase } from '@/utils/supabase/getDataWhenAuth'

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    const { tweet, agentId, userId: providedUserId } = requestData

    // Validate request
    if (!tweet) {
      return NextResponse.json(
        { error: 'Missing tweet content' },
        { status: 400 }
      )
    }

    // Get the NextAuth session WITH authOptions
    const session = await getServerSession(authOptions)
    console.log('Send-tweet session:', JSON.stringify(session, null, 2));
    
    // Check if we have a valid session with the token
    if (!session?.supabaseAccessToken) {
      console.log('Missing supabaseAccessToken in session, authentication will likely fail');
    }
    
    // Get authenticated Supabase client
    const supabase = getSupabase(session)
    console.log('Created Supabase client with session token');
    
    // Try to determine the user ID
    let userId = providedUserId;
    
    // If no userId was provided directly, try to get it from the agent
    if (!userId && agentId) {
      console.log('Trying to get user ID from agent:', agentId);
      const { data: agent } = await supabase
        .from('ai_agents')
        .select('user_id')
        .eq('id', agentId)
        .maybeSingle();
        
      if (agent?.user_id) {
        userId = agent.user_id;
        console.log('Got user ID from agent:', userId);
      }
    }
    
    // If we still don't have a user ID, check the session
    if (!userId && session?.user?.id) {
      userId = session.user.id;
      console.log('Got user ID from session:', userId);
    }
    
    // CRITICAL: Ensure the user_id field matches the authenticated user's ID
    // to satisfy the RLS policy: (auth.uid() = user_id)
    if (session?.user?.id && userId !== session.user.id) {
      console.log(`Overriding user_id to match authenticated user (${userId} -> ${session.user.id})`);
      userId = session.user.id;
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unable to determine user ID.' },
        { status: 400 }
      );
    }

    // Test read access to see if authentication is working
    console.log('Testing authentication with a simple query...');
    const { data: testData, error: testError } = await supabase
      .from('posts')
      .select('id')
      .limit(1);
      
    if (testError) {
      console.error('Authentication test failed:', testError);
      return NextResponse.json(
        { error: 'Authentication failed: ' + testError.message },
        { status: 401 }
      );
    }
    
    console.log('Authentication test successful');

    // Create the post with timestamps
    const now = new Date().toISOString();
    const postData = {
      user_id: userId,
      content: tweet,
      type: 'text',
      created_at: now,
      updated_at: now,
      metadata: {
        agent_id: agentId || null,
        twitter_status: 'pending',
        is_tweet: true
      }
    };
    
    console.log('Inserting post data:', postData);
    
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (postError) {
      console.error('Post creation error:', postError);
      return NextResponse.json(
        { error: 'Failed to save tweet: ' + postError.message },
        { status: 500 }
      );
    }

    // If we have an agent, update its stats
    if (agentId) {
      const { data: agent } = await supabase
        .from('ai_agents')
        .select('performance_metrics')
        .eq('id', agentId)
        .maybeSingle();
      
      if (agent) {
        const newTweetCount = (agent.performance_metrics?.total_tweets || 0) + 1;
        
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
          .eq('id', agentId);

        if (updateError) {
          console.error('Agent update error:', updateError);
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Tweet saved successfully",
      post: newPost
    });
  } catch (error) {
    console.error('Send tweet error:', error);
    return NextResponse.json(
      { error: 'Failed to send tweet: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}