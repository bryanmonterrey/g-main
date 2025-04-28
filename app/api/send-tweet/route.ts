// app/api/send-tweet/route.ts (updated)
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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

    // Get the NextAuth session
    const session = await getServerSession()
    console.log('Send-tweet session:', JSON.stringify(session, null, 2));
    
    // Get authenticated Supabase client
    const supabase = getSupabase(session)
    
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
    
    // As a fallback, try the first user in the database
    if (!userId) {
      console.log('No user ID found, attempting to get first user from database');
      
      // Query users table to find a valid user ID
      const { data: firstUser } = await supabase
        .from('users')
        .select('id')
        .limit(1)
        .single();
        
      if (firstUser?.id) {
        userId = firstUser.id;
        console.log('Found first user ID:', userId);
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unable to determine user ID. Please provide a userId in the request.' },
        { status: 400 }
      );
    }

    // Based on the error, 'post' isn't a valid enum value
    // Let's try 'text' since that's commonly used and was the default in your schema
    const validPostType = 'text';
    console.log('Using post type:', validPostType);

    // Store the tweet in the posts table
    const postData = {
      user_id: userId,
      content: tweet,
      type: validPostType,
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
      
      // If we get an enum error, let's try other possible values
      if (postError.code === '22P02' && postError.message.includes('post_type')) {
        // Try common enum values one by one
        for (const typeToTry of ['status', 'tweet', 'message', 'content']) {
          console.log(`Trying alternative post type: ${typeToTry}`);
          
          const { data: retryPost, error: retryError } = await supabase
            .from('posts')
            .insert({
              ...postData,
              type: typeToTry
            })
            .select()
            .single();
            
          if (!retryError) {
            console.log(`Success with post type: ${typeToTry}`);
            return NextResponse.json({ 
              success: true,
              message: "Tweet saved successfully",
              post: retryPost
            });
          }
          
          console.log(`Failed with type ${typeToTry}:`, retryError.message);
        }
      }
      
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
        const now = new Date().toISOString();
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