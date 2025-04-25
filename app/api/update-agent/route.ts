// app/api/update-agent/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getSupabase } from '@/utils/supabase/getDataWhenAuth'

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    const { agentId, agentData } = requestData

    if (!agentId || !agentData) {
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

    // Check if agent exists and belongs to user
    const { data: existingAgent, error: checkError } = await supabase
      .from('ai_agents')
      .select('id, user_id')
      .eq('id', agentId)
      .maybeSingle()

    if (checkError) {
      console.error('Agent check error:', checkError)
      return NextResponse.json(
        { error: 'Error checking agent' },
        { status: 500 }
      )
    }

    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Update the agent
    const { data: updatedAgent, error: updateError } = await supabase
      .from('ai_agents')
      .update({
        ...agentData,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId)
      .select()
      .single()

    if (updateError) {
      console.error('Agent update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update agent' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, agent: updatedAgent })
  } catch (error) {
    console.error('Update agent error:', error)
    return NextResponse.json(
      { error: 'Failed to update agent: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}