// app/api/send-tweet/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Use a regular CommonJS require for the Twitter API
// This avoids the initialization error
let twitterApi;
try {
  twitterApi = require('twitter-api-v2');
} catch (error) {
  console.warn('Twitter API package not available:', error.message);
}

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    const { tweet, agentId, userId: providedUserId, postToTwitter = true } = requestData

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
    
    // Try to determine the user ID
    let userId = providedUserId;
    
    // If no userId was provided directly and we have a session, use that
    if (!userId && session?.user?.id) {
      userId = session.user.id;
      console.log('Using user ID from session:', userId);
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unable to determine user ID.' },
        { status: 400 }
      );
    }

    // Generate a unique ID for the post
    const postId = randomUUID();
    const now = new Date().toISOString();
    let twitterId = null;
    let twitterStatus = 'pending';
    let twitterError = null;
    
    console.log('Creating post with ID:', postId);
    
    // Step 1: If postToTwitter is true and Twitter API is available, attempt to post to Twitter
    if (postToTwitter && twitterApi) {
      console.log('Twitter API is available, attempting to post to Twitter');
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        // Get the user's Twitter API keys
        const { data: apiKeys, error: apiKeysError } = await supabase
          .from('user_api_keys')
          .select('twitter_api_key, twitter_api_secret, twitter_access_token, twitter_access_secret')
          .eq('user_id', userId)
          .single();
          
        if (apiKeysError || !apiKeys) {
          console.error(`Twitter API keys not found for user ${userId}:`, apiKeysError);
          twitterStatus = 'failed';
          twitterError = 'Twitter API keys not configured';
        } else if (!apiKeys.twitter_api_key || !apiKeys.twitter_api_secret || 
                   !apiKeys.twitter_access_token || !apiKeys.twitter_access_secret) {
          console.error(`Incomplete Twitter API keys for user ${userId}`);
          twitterStatus = 'failed';
          twitterError = 'Incomplete Twitter API configuration';
        } else {
          // Initialize Twitter client with user credentials
          const TwitterApi = twitterApi.TwitterApi;
          const twitterClient = new TwitterApi({
            appKey: apiKeys.twitter_api_key,
            appSecret: apiKeys.twitter_api_secret,
            accessToken: apiKeys.twitter_access_token,
            accessSecret: apiKeys.twitter_access_secret
          });
          
          // Post the tweet to Twitter
          console.log(`Posting tweet to Twitter: ${tweet}`);
          const twitterResponse = await twitterClient.v2.tweet(tweet);
          
          twitterId = twitterResponse.data.id;
          twitterStatus = 'sent';
          console.log(`Tweet successfully posted to Twitter with ID: ${twitterId}`);
        }
      } catch (error) {
        console.error('Error posting to Twitter:', error);
        twitterStatus = 'failed';
        twitterError = error instanceof Error ? error.message : String(error);
      }
    } else {
      console.log('Skipping Twitter posting - postToTwitter is', postToTwitter, 'twitterApi available:', !!twitterApi);
    }
    
    // Step 2: Save the tweet to the database
    // Prepare the parameters for the SQL function call
    const sqlParams = {
      p_post_id: postId,
      p_user_id: userId,
      p_content: tweet,
      p_agent_id: agentId || null,
      p_created_at: now,
      p_updated_at: now,
      p_twitter_status: twitterStatus
    };
    
    // Add optional parameters if they exist
    if (twitterId) {
      sqlParams.p_twitter_id = twitterId;
    }
    
    if (twitterError) {
      sqlParams.p_error_message = twitterError;
    }
    
    // Execute the SQL function to save the tweet
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/execute_tweet_insert`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(sqlParams)
      }
    );
    
    if (!result.ok) {
      const errorDetails = await result.text();
      console.error('SQL execution error:', result.status, errorDetails);
      return NextResponse.json(
        { error: `Failed to save tweet: ${result.status} ${errorDetails}` },
        { status: 500 }
      );
    }
    
    const newPost = await result.json();
    console.log('Post created successfully:', newPost);
    
    // If we have an agent, update its stats
    if (agentId) {
      try {
        // Update agent stats using another RPC call
        const agentStatsResult = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/update_agent_tweet_stats`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              p_agent_id: agentId,
              p_timestamp: now
            })
          }
        );
        
        if (!agentStatsResult.ok) {
          console.error('Failed to update agent stats:', await agentStatsResult.text());
        } else {
          console.log('Agent stats updated successfully');
        }
      } catch (error) {
        console.error('Error updating agent stats:', error);
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: twitterStatus === 'sent' 
        ? "Tweet sent to Twitter and saved successfully" 
        : (twitterStatus === 'failed' 
           ? `Tweet saved but failed to post to Twitter: ${twitterError}` 
           : "Tweet saved successfully"),
      twitterPosted: twitterStatus === 'sent',
      twitterError: twitterError,
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