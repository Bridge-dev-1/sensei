'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import {
  STUDY_PLAN, PHASE_LABELS, PHASE_COLORS,
  getDaysUntilExam, getTodayDayNumber, EXAM_DATE,
} from '@/lib/study-plan'
import { CalendarDays, CheckCircle2, Circle, PlayCircle, BookOpen, Pencil, RotateCcw, Trophy } from 'lucide-react'

const MODE_ICON = {
  chat:   <BookOpen size={12} />,
  quiz:   <Pencil size={12} />,
  review: <RotateCcw size={12} />,
}

const MODE_LABEL = { chat: 'Clase', quiz: 'Quiz', review: 'Repaso' }

const PHASE_BG: Record<string, string> = {
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  purple: 'bg-purple-500',
  red:    'bg-red-500',
}
const PHASE_LIGHT: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-green-100 text-green-700',
  purple: 'bg-purple-100 text-purple-700',
  red:    'bg-red-100 text-red-700',
}
const PHASE_BORDER: Record<string, string> = {
  blue:   'border-blue-400 bg-blue-50',
  green:  'border-green-400 bg-green-50',
  purple: 'border-purple-400 bg-purple-50',
  red:    'border-red-400 bg-red-50',
}

export default function PlanPage() {
  const router = useRouter()
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const todayDay = getTodayDayNumber()
  const daysLeft = getDaysUntilExam()
  const todayPlan = STUDY_PLAN[todayDay - 1]

  useEffect(() => {
    fetch('/api/daily-checkin')
      .then(r => r.json())
      .then(data => {
        setCompleted(new Set(data.completed ?? []))
        setLoading(false)
      })
  }, [])

  const markToday = async () => {
    if (marking || completed.has(todayDay)) return
    setMarking(true)
    await fetch('/api/daily-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayNumber: todayDay }),
    })
    setCompleted(prev => new Set([...prev, todayDay]))
    setMarking(false)
  }

  const startLesson = async () => {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Día ${todayDay}: ${todayPlan.topicName}`, mode: todayPlan.mode }),
    })
    const session = await res.json()
    router.push(`/chat?session=${session.id}&quizTopic=${todayPlan.topicId}&planDay=${todayDay}`)
  }

  const completedCount = completed.size
  const totalDays = STUDY_PLAN.length
  const globalPct = Math.round((completedCount / totalDays) * 100)

  // Phase stats
  const phases = [1, 2, 3, 4] as const
  const phaseDays = phases.map(p => STUDY_PLAN.filter(d => d.phase === p))
  const phaseCompleted = phases.map((p, i) =>
    phaseDays[i].filter(d => completed.has(d.day)).length
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header: countdown */}
        <div className="bg-gradient-to-r from-red-700 to-red-900 rounded-3xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-200 text-sm font-medium mb-1">JLPT N3 — {EXAM_DATE}</p>
              <h1 className="text-4xl font-bold">{daysLeft} días</h1>
              <p className="text-red-200 mt-1">para el examen · {completedCount}/{totalDays} días completados</p>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-5xl font-black">{globalPct}%</div>
              <p className="text-red-200 text-sm">del plan completado</p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-red-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${globalPct}%` }}
            />
          </div>
        </div>

        {/* Today's lesson */}
        {todayPlan && (
          <div className={`border-2 rounded-2xl p-5 mb-8 shadow-sm ${PHASE_BORDER[PHASE_COLORS[todayPlan.phase]]}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays size={16} className="text-gray-500" />
                  <span className="text-sm font-semibold text-gray-600">Día {todayDay} — Hoy</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${PHASE_LIGHT[PHASE_COLORS[todayPlan.phase]]}`}>
                    Fase {todayPlan.phase}: {PHASE_LABELS[todayPlan.phase]}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{todayPlan.topicName}</h2>
                <p className="text-sm text-gray-600">{todayPlan.description}</p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={startLesson}
                  className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-800 transition-colors"
                >
                  <PlayCircle size={16} />
                  Estudiar
                </button>
                {!completed.has(todayDay) ? (
                  <button
                    onClick={markToday}
                    disabled={marking}
                    className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Circle size={16} />
                    Marcar listo
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-green-600 px-4 py-2 text-sm font-medium">
                    <CheckCircle2 size={16} />
                    Completado
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Phase progress */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {phases.map((phase, i) => {
            const total = phaseDays[i].length
            const done = phaseCompleted[i]
            const pct = Math.round((done / total) * 100)
            const color = PHASE_COLORS[phase]
            return (
              <div key={phase} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2 ${PHASE_LIGHT[color]}`}>
                  Fase {phase}
                </div>
                <p className="text-sm font-semibold text-gray-800 leading-tight mb-2">{PHASE_LABELS[phase]}</p>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                  <div className={`h-full rounded-full ${PHASE_BG[color]}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-500">{done}/{total} días</p>
              </div>
            )
          })}
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Calendario completo</h2>

          {loading ? (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">Cargando...</div>
          ) : (
            <div className="space-y-6">
              {phases.map((phase) => {
                const days = STUDY_PLAN.filter(d => d.phase === phase)
                const color = PHASE_COLORS[phase]
                return (
                  <div key={phase}>
                    <p className={`text-xs font-semibold mb-2 ${PHASE_LIGHT[color]} px-2 py-0.5 rounded-full inline-block`}>
                      Fase {phase}: {PHASE_LABELS[phase]}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {days.map((d) => {
                        const isToday = d.day === todayDay
                        const isDone = completed.has(d.day)
                        const isPast = d.day < todayDay
                        return (
                          <div
                            key={d.day}
                            title={`Día ${d.day}: ${d.topicName} — ${MODE_LABEL[d.mode]}`}
                            className={`
                              w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium cursor-default transition-all
                              ${isToday ? `ring-2 ring-offset-1 ${PHASE_BG[color]} text-white ring-${color}-400` : ''}
                              ${isDone && !isToday ? 'bg-gray-800 text-white' : ''}
                              ${!isDone && !isToday && isPast ? 'bg-red-100 text-red-600' : ''}
                              ${!isDone && !isToday && !isPast ? 'bg-gray-100 text-gray-400' : ''}
                            `}
                          >
                            {isDone ? '✓' : d.day}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-gray-100">
            {[
              { label: 'Completado', cls: 'bg-gray-800 text-white w-4 h-4 rounded' },
              { label: 'Hoy', cls: 'bg-red-500 w-4 h-4 rounded' },
              { label: 'Perdido', cls: 'bg-red-100 text-red-600 w-4 h-4 rounded' },
              { label: 'Pendiente', cls: 'bg-gray-100 w-4 h-4 rounded' },
            ].map(({ label, cls }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className={cls} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Exam day banner */}
        <div className="mt-6 text-center py-4 flex items-center justify-center gap-2 text-gray-500 text-sm">
          <Trophy size={16} className="text-amber-500" />
          JLPT N3 — {EXAM_DATE} — ¡Tú puedes! 頑張れ！
        </div>
      </div>
    </div>
  )
}
