// app/api/agent/create/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getSupabase } from '@/utils/supabase/supabase';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { name, settings } = await request.json();

    const { data, error } = await supabase
      .from('ai_agents')
      .insert({
        user_id: session.user.id,
        name: name || 'My AI Agent',
        status: 'inactive',
        mode: 'manual',
        settings: settings || {
          tone: 'professional',
          topics: [],
          tweet_frequency: 1,
          engagement_enabled: false
        },
        performance_metrics: {
          total_tweets: 0,
          total_likes: 0,
          total_retweets: 0,
          avg_engagement_rate: 0
        }
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}