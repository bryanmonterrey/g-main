// app/api/delete-agent/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getSupabase } from '@/utils/supabase/getDataWhenAuth'

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    const { agentId } = requestData

    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing agent ID' },
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

    // Delete the agent
    const { error: deleteError } = await supabase
      .from('ai_agents')
      .delete()
      .eq('id', agentId)

    if (deleteError) {
      console.error('Agent deletion error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete agent' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete agent error:', error)
    return NextResponse.json(
      { error: 'Failed to delete agent: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}