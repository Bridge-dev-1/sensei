'use client'

import { CheckCircle2, Circle, Clock } from 'lucide-react'

interface TopicCardProps {
  id: string
  name: string
  chapter: string
  level: number
  status: 'not_started' | 'in_progress' | 'completed'
  lastScore?: number
  onStudy: (topicId: string) => void
}

const levelColors = ['', 'bg-green-100 text-green-700', 'bg-blue-100 text-blue-700', 'bg-amber-100 text-amber-700', 'bg-red-100 text-red-700']
const levelLabels = ['', 'Básico', 'Intermedio', 'Avanzado', 'Difícil']

export default function TopicCard({ id, name, chapter, level, status, lastScore, onStudy }: TopicCardProps) {
  const statusIcon = {
    not_started: <Circle size={16} className="text-gray-300" />,
    in_progress: <Clock size={16} className="text-amber-500" />,
    completed: <CheckCircle2 size={16} className="text-green-500" />,
  }[status]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-red-200 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {statusIcon}
          <h3 className="text-sm font-medium text-gray-800">{name}</h3>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${levelColors[level]}`}>
          {levelLabels[level]}
        </span>
      </div>
      <p className="text-xs text-gray-500 ml-6 mb-3">{chapter}</p>
      {lastScore !== undefined && (
        <div className="ml-6 mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Último quiz</span>
            <span className={`font-medium ${lastScore >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
              {lastScore}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${lastScore >= 70 ? 'bg-green-500' : 'bg-amber-500'}`}
              style={{ width: `${lastScore}%` }}
            />
          </div>
        </div>
      )}
      <button
        onClick={() => onStudy(id)}
        className="ml-6 text-xs font-medium text-red-700 hover:text-red-800 transition-colors"
      >
        {status === 'not_started' ? 'Empezar →' : 'Continuar →'}
      </button>
    </div>
  )
}
