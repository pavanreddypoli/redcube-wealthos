import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST — create a note
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { client_id, assessment_id, title, body: noteBody, is_private = true, tags = [] } = body

    if (!noteBody?.trim()) {
      return NextResponse.json({ error: 'Note body is required' }, { status: 400 })
    }
    if (!client_id && !assessment_id) {
      return NextResponse.json({ error: 'Must link to a client or assessment' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('advisor_notes')
      .insert({ advisor_id: user.id, client_id, assessment_id, title, body: noteBody, is_private, tags })
      .select('id, created_at')
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })

  } catch (err) {
    console.error('Notes POST error:', err)
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }
}

// GET — list notes for a client or assessment
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const client_id = searchParams.get('client_id')
    const assessment_id = searchParams.get('assessment_id')

    let query = supabase
      .from('advisor_notes')
      .select('*')
      .order('created_at', { ascending: false })

    if (client_id)     query = query.eq('client_id', client_id)
    if (assessment_id) query = query.eq('assessment_id', assessment_id)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data)

  } catch (err) {
    console.error('Notes GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

// PATCH — update a note
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing note id' }, { status: 400 })

    const { data, error } = await supabase
      .from('advisor_notes')
      .update(updates)
      .eq('id', id)
      .eq('advisor_id', user.id)  // can only edit own notes
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)

  } catch (err) {
    console.error('Notes PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}

// DELETE — delete a note
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { error } = await supabase
      .from('advisor_notes')
      .delete()
      .eq('id', id)
      .eq('advisor_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Notes DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}