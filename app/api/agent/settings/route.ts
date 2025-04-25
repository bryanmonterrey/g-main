// app/api/agent/settings/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getSupabase } from '@/utils/supabase/getDataWhenAuth'

// Get agent settings
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

    // Get agent settings
    const { data: agent, error: queryError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .maybeSingle()

    if (queryError) {
      console.error('Agent query error:', queryError)
      return NextResponse.json(
        { error: 'Failed to query agent settings' },
        { status: 500 }
      )
    }

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, agent })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Failed to get agent settings: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}

// Update agent settings
export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    const { agentId, settings, name } = requestData

    if (!agentId || (!settings && !name)) {
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

    // Get current agent settings first
    const { data: currentAgent, error: queryError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .maybeSingle()

    if (queryError) {
      console.error('Agent query error:', queryError)
      return NextResponse.json(
        { error: 'Failed to query current agent settings' },
        { status: 500 }
      )
    }

    if (!currentAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name) {
      updateData.name = name
    }

    if (settings) {
      updateData.settings = {
        ...currentAgent.settings,
        ...settings
      }
    }

    // Update agent settings
    const { data: updatedAgent, error: updateError } = await supabase
      .from('ai_agents')
      .update(updateData)
      .eq('id', agentId)
      .select()
      .single()

    if (updateError) {
      console.error('Agent settings update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update agent settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, agent: updatedAgent })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update agent settings: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}

// Delete agent
export async function DELETE(request: Request) {
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