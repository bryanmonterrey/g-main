// app/api/agent/automation/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getSupabase } from '@/utils/supabase/getDataWhenAuth'

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    const { agentId, isAutomated } = requestData

    if (!agentId || typeof isAutomated !== 'boolean') {
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

    // Get authenticated Supabase client
    const supabase = getSupabase(session)

    // Update agent automation settings
    const { data: updatedAgent, error: updateError } = await supabase
      .from('ai_agents')
      .update({
        mode: isAutomated ? 'auto' : 'manual',
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId)
      .select()
      .single()

    if (updateError) {
      console.error('Agent automation update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update agent automation settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, agent: updatedAgent })
  } catch (error) {
    console.error('Automation settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update automation settings: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}

// Handle GET request to check automation status
export async function GET(request: Request) {
  const url = new URL(request.url)
  const agentId = url.searchParams.get('agentId')
  
  if (!agentId) {
    return NextResponse.json(
      { error: 'Missing agent ID' },
      { status: 400 }
    )
  }

  try {
    // Get the NextAuth session
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get authenticated Supabase client
    const supabase = getSupabase(session)

    // Get agent with automation settings
    const { data: agent, error: queryError } = await supabase
      .from('ai_agents')
      .select('id, mode, settings')
      .eq('id', agentId)
      .maybeSingle()

    if (queryError) {
      console.error('Agent query error:', queryError)
      return NextResponse.json(
        { error: 'Failed to query agent' },
        { status: 500 }
      )
    }

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      isAutomated: agent.mode === 'auto',
      settings: agent.settings
    })
  } catch (error) {
    console.error('Get automation status error:', error)
    return NextResponse.json(
      { error: 'Failed to get automation status: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}