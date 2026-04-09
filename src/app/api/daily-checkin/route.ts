import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const { dayNumber } = await req.json()

  const { error } = await supabase.from('daily_checkins').upsert({
    user_id: user.id,
    day_number: dayNumber,
  }, { onConflict: 'user_id,day_number' })

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const { data } = await supabase
    .from('daily_checkins')
    .select('day_number')
    .eq('user_id', user.id)

  const completed = (data ?? []).map(r => r.day_number)
  return new Response(JSON.stringify({ completed }), { status: 200 })
}
