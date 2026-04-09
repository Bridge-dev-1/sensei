import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { MessageCircle, Pencil, BookOpen, BarChart2, TrendingUp, CalendarDays, Trophy } from 'lucide-react'
import { N3_TOPICS } from '@/lib/professor-prompt'
import { STUDY_PLAN, PHASE_LABELS, getDaysUntilExam, getTodayDayNumber } from '@/lib/study-plan'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: progress } = await supabase
    .from('study_progress')
    .select('*')
    .eq('user_id', user.id)

  const { data: recentQuizzes } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentSessions } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(3)

  const completedTopics = progress?.filter(p => p.status === 'completed').length ?? 0
  const totalTopics = N3_TOPICS.length
  const overallProgress = Math.round((completedTopics / totalTopics) * 100)

  const avgScore = recentQuizzes?.length
    ? Math.round(recentQuizzes.reduce((acc, q) => acc + (q.score / q.total) * 100, 0) / recentQuizzes.length)
    : null

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Estudiante'

  const todayDay = getTodayDayNumber()
  const daysLeft = getDaysUntilExam()
  const todayPlan = STUDY_PLAN[todayDay - 1]

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-1">おかえり、{displayName}さん</p>
          <h1 className="text-3xl font-bold text-gray-900">¡Bienvenido de vuelta!</h1>
          <p className="text-gray-600 mt-1">Nivel actual: <span className="font-semibold text-red-700">{profile?.current_level ?? 'N4'} → {profile?.target_level ?? 'N3'}</span></p>
        </div>

        {/* Countdown + Today's lesson */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-700 to-red-900 text-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-red-200">
              <Trophy size={16} />
              <span className="text-xs font-medium">JLPT N3 — 5 julio 2026</span>
            </div>
            <p className="text-5xl font-black">{daysLeft}</p>
            <p className="text-red-200 text-sm mt-1">días para el examen</p>
            <Link href="/plan" className="inline-block mt-3 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
              Ver plan completo →
            </Link>
          </div>
          {todayPlan && (
            <div className="bg-white border-2 border-blue-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-blue-600">
                <CalendarDays size={16} />
                <span className="text-xs font-medium">Día {todayDay} — Hoy · Fase {todayPlan.phase}: {PHASE_LABELS[todayPlan.phase]}</span>
              </div>
              <p className="font-bold text-gray-900 text-lg leading-tight mb-1">{todayPlan.topicName}</p>
              <p className="text-xs text-gray-500 mb-3">{todayPlan.description}</p>
              <Link
                href={`/plan`}
                className="inline-flex items-center gap-1.5 bg-red-700 text-white text-sm px-4 py-2 rounded-xl hover:bg-red-800 transition-colors font-medium"
              >
                Ir a estudiar →
              </Link>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Temas completados', value: `${completedTopics}/${totalTopics}`, icon: BookOpen, color: 'text-blue-700 bg-blue-50' },
            { label: 'Progreso global', value: `${overallProgress}%`, icon: TrendingUp, color: 'text-green-700 bg-green-50' },
            { label: 'Score promedio', value: avgScore !== null ? `${avgScore}%` : '—', icon: BarChart2, color: 'text-amber-700 bg-amber-50' },
            { label: 'Sesiones totales', value: String(recentSessions?.length ?? 0), icon: MessageCircle, color: 'text-red-700 bg-red-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Progreso hacia N3</h2>
            <span className="text-sm font-medium text-red-700">{overallProgress}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-700 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {completedTopics === 0
              ? '¡Empieza tu primera lección!'
              : `${completedTopics} de ${totalTopics} temas completados`}
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link
            href="/chat"
            className="bg-red-700 text-white rounded-2xl p-5 hover:bg-red-800 transition-colors group shadow-sm"
          >
            <MessageCircle size={24} className="mb-3" />
            <h3 className="font-semibold text-lg">Hablar con Tanaka-sensei</h3>
            <p className="text-red-200 text-sm mt-1">Pregunta, practica y aprende</p>
          </Link>
          <Link
            href="/quiz"
            className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-red-300 hover:shadow-md transition-all"
          >
            <Pencil size={24} className="text-red-700 mb-3" />
            <h3 className="font-semibold text-gray-900 text-lg">Hacer un Quiz</h3>
            <p className="text-gray-500 text-sm mt-1">Pon a prueba tu nivel N3</p>
          </Link>
          <Link
            href="/progress"
            className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-red-300 hover:shadow-md transition-all"
          >
            <BarChart2 size={24} className="text-red-700 mb-3" />
            <h3 className="font-semibold text-gray-900 text-lg">Ver Progreso</h3>
            <p className="text-gray-500 text-sm mt-1">Temas y resultados detallados</p>
          </Link>
        </div>

        {/* Recent sessions */}
        {recentSessions && recentSessions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Sesiones recientes</h2>
            <div className="space-y-2">
              {recentSessions.map(session => (
                <Link
                  key={session.id}
                  href={`/chat?session=${session.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                      {session.mode === 'quiz' ? <Pencil size={14} className="text-red-700" /> : <MessageCircle size={14} className="text-red-700" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{session.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(session.updated_at).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${session.mode === 'quiz' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {session.mode === 'quiz' ? 'Quiz' : 'Chat'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
