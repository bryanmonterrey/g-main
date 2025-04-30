// app/api/send-tweet/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Simple Twitter client for just posting tweets
class SimpleTwitterClient {
  private apiKey: string;
  private apiSecret: string;
  private accessToken: string;
  private accessSecret: string;

  constructor(credentials: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  }) {
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
    this.accessToken = credentials.accessToken;
    this.accessSecret = credentials.accessSecret;
  }

  // Create OAuth 1.0a signature
  private createSignature(method: string, url: string, params: Record<string, string>): string {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
    const signingKey = `${encodeURIComponent(this.apiSecret)}&${encodeURIComponent(this.accessSecret)}`;
    
    return crypto
      .createHmac('sha1', signingKey)
      .update(signatureBaseString)
      .digest('base64');
  }

  // Post a tweet
  async tweet(text: string): Promise<{ id: string }> {
    const url = 'https://api.twitter.com/2/tweets';
    const method = 'POST';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    // OAuth parameters
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: this.apiKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: this.accessToken,
      oauth_version: '1.0'
    };

    // Add signature
    const signature = this.createSignature(method, url, oauthParams);
    oauthParams.oauth_signature = signature;

    // Create Authorization header
    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');

    // Send the request
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twitter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return { id: data.data.id };
  }
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
    
    // Step 1: If postToTwitter is true, attempt to post to Twitter
    if (postToTwitter) {
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
          
        console.log('API keys retrieved:', !!apiKeys, 'Error:', !!apiKeysError);
          
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
          console.log('Creating Twitter client with API keys');
          // Initialize our simple Twitter client
          const twitterClient = new SimpleTwitterClient({
            apiKey: apiKeys.twitter_api_key,
            apiSecret: apiKeys.twitter_api_secret,
            accessToken: apiKeys.twitter_access_token,
            accessSecret: apiKeys.twitter_access_secret
          });
          
          // Post the tweet to Twitter
          console.log(`Posting tweet to Twitter: ${tweet}`);
          const twitterResponse = await twitterClient.tweet(tweet);
          
          twitterId = twitterResponse.id;
          twitterStatus = 'sent';
          console.log(`Tweet successfully posted to Twitter with ID: ${twitterId}`);
        }
      } catch (error) {
        console.error('Error posting to Twitter:', error);
        twitterStatus = 'failed';
        twitterError = error instanceof Error ? error.message : String(error);
      }
    } else {
      console.log('Skipping Twitter posting - postToTwitter is false');
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