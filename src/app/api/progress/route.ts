import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [progressRes, quizRes] = await Promise.all([
    supabase.from('study_progress').select('*').eq('user_id', user.id),
    supabase.from('quiz_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  return NextResponse.json({
    progress: progressRes.data ?? [],
    quizResults: quizRes.data ?? [],
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { topicId, status } = await req.json()

  const { data, error } = await supabase
    .from('study_progress')
    .upsert({
      user_id: user.id,
      topic_id: topicId,
      status,
      last_studied_at: new Date().toISOString(),
    }, { onConflict: 'user_id,topic_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
