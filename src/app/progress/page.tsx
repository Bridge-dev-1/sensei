import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { N3_TOPICS } from '@/lib/professor-prompt'
import { CheckCircle2, Circle, Clock, TrendingUp, Award } from 'lucide-react'
import Link from 'next/link'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [progressRes, quizRes] = await Promise.all([
    supabase.from('study_progress').select('*').eq('user_id', user.id),
    supabase.from('quiz_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const progress = progressRes.data ?? []
  const quizResults = quizRes.data ?? []

  const progressMap = Object.fromEntries(progress.map(p => [p.topic_id, p]))

  const quizByTopic: Record<string, { scores: number[]; latest: number }> = {}
  quizResults.forEach(q => {
    if (!quizByTopic[q.topic_id]) quizByTopic[q.topic_id] = { scores: [], latest: 0 }
    const pct = Math.round((q.score / q.total) * 100)
    quizByTopic[q.topic_id].scores.push(pct)
    if (!quizByTopic[q.topic_id].latest) quizByTopic[q.topic_id].latest = pct
  })

  const completedTopics = progress.filter(p => p.status === 'completed').length
  const inProgressTopics = progress.filter(p => p.status === 'in_progress').length
  const overallProgress = Math.round((completedTopics / N3_TOPICS.length) * 100)

  const avgQuizScore = quizResults.length
    ? Math.round(quizResults.reduce((acc, q) => acc + (q.score / q.total) * 100, 0) / quizResults.length)
    : null

  // Find weak topics
  const weakTopics = N3_TOPICS.filter(t => {
    const topicQuizzes = quizByTopic[t.id]
    return topicQuizzes && topicQuizzes.latest < 70
  })

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">進歩 — Tu Progreso</h1>
          <p className="text-gray-600 mt-1">Seguimiento detallado de tu camino al N3</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Completados', value: `${completedTopics}/${N3_TOPICS.length}`, icon: CheckCircle2, color: 'text-green-700 bg-green-50' },
            { label: 'En progreso', value: String(inProgressTopics), icon: Clock, color: 'text-amber-700 bg-amber-50' },
            { label: 'Progreso global', value: `${overallProgress}%`, icon: TrendingUp, color: 'text-blue-700 bg-blue-50' },
            { label: 'Score promedio', value: avgQuizScore !== null ? `${avgQuizScore}%` : '—', icon: Award, color: 'text-red-700 bg-red-50' },
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

        {/* Global progress bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900">N4 → N3</span>
            <span className="text-sm font-medium text-red-700">{overallProgress}%</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-400 to-red-700 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>N4</span>
            <span>N3 合格！</span>
          </div>
        </div>

        {/* Recommendations */}
        {weakTopics.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
            <h2 className="font-semibold text-amber-800 mb-3">⚠️ 先生のアドバイス — Áreas a reforzar</h2>
            <div className="space-y-2">
              {weakTopics.slice(0, 3).map(topic => (
                <div key={topic.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-amber-100">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{topic.name}</p>
                    <p className="text-xs text-amber-600">Score: {quizByTopic[topic.id].latest}% — Necesita práctica</p>
                  </div>
                  <Link
                    href={`/quiz?topic=${topic.id}`}
                    className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Practicar
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topics grid */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Todos los temas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {N3_TOPICS.map(topic => {
              const topicProgress = progressMap[topic.id]
              const status = topicProgress?.status ?? 'not_started'
              const quizData = quizByTopic[topic.id]

              return (
                <div key={topic.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-red-200 transition-colors">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="mt-0.5">
                      {status === 'completed' && <CheckCircle2 size={16} className="text-green-500" />}
                      {status === 'in_progress' && <Clock size={16} className="text-amber-500" />}
                      {status === 'not_started' && <Circle size={16} className="text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-800 leading-tight">{topic.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{topic.chapter}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      topic.level === 1 ? 'bg-green-100 text-green-700' :
                      topic.level === 2 ? 'bg-blue-100 text-blue-700' :
                      topic.level === 3 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      N{topic.level + 2}
                    </span>
                  </div>
                  {quizData && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-400">Último quiz</span>
                        <span className={`font-medium ${quizData.latest >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
                          {quizData.latest}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${quizData.latest >= 70 ? 'bg-green-400' : 'bg-amber-400'}`}
                          style={{ width: `${quizData.latest}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
