// app/api/agent/automation/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getSupabase } from '@/utils/supabase/supabase';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { agentId, automationSettings } = await request.json();

    // Update agent's automation settings
    const { data, error } = await supabase
      .from('ai_agents')
      .update({ 
        settings: automationSettings,
        updated_at: new Date().toISOString() 
      })
      .eq('id', agentId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating automation settings:', error);
    return NextResponse.json(
      { error: 'Failed to update automation settings' },
      { status: 500 }
    );
  }
}