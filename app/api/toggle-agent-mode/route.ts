// app/api/toggle-agent-mode/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getSupabase } from '@/utils/supabase/getDataWhenAuth'

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    const { agentId, mode } = requestData

    if (!agentId || !mode || (mode !== 'auto' && mode !== 'manual')) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
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

    // Update agent mode
    const { data: updatedAgent, error: updateError } = await supabase
      .from('ai_agents')
      .update({
        mode: mode,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId)
      .select()
      .single()

    if (updateError) {
      console.error('Agent mode update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update agent mode' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, agent: updatedAgent })
  } catch (error) {
    console.error('Toggle agent mode error:', error)
    return NextResponse.json(
      { error: 'Failed to toggle agent mode: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}