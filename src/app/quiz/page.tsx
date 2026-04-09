'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { N3_TOPICS } from '@/lib/professor-prompt'
import { Pencil, ChevronRight, Loader2 } from 'lucide-react'

const QUIZ_TOPICS = [
  { id: 'all', name: 'Todo N3 (mixto)', desc: 'Preguntas variadas de gramática, vocabulario y kanji', emoji: '🎯' },
  { id: 'grammar', name: 'Solo Gramática', desc: 'Todos los patrones gramaticales N3', emoji: '📝' },
  { id: 'vocabulary', name: 'Solo Vocabulario', desc: 'Palabras nivel N3', emoji: '📖' },
  { id: 'kanji', name: 'Solo Kanji', desc: 'Lectura y significado de kanji N3', emoji: '漢' },
  { id: 'reading', name: 'Comprensión Lectora', desc: 'Textos cortos tipo JLPT', emoji: '📄' },
]

export default function QuizPage() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  const startQuiz = async (topicId: string, topicName: string) => {
    setCreating(true)
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Quiz: ${topicName}`,
        mode: 'quiz',
      }),
    })
    const session = await res.json()
    router.push(`/chat?session=${session.id}&quizTopic=${topicId}`)
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
            <Pencil size={14} />
            クイズ
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Quiz N3</h1>
          <p className="text-gray-600 mt-1">Elige el tipo de quiz que quieres hacer con Tanaka-sensei</p>
        </div>

        {/* Main quiz types */}
        <div className="space-y-3 mb-10">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Modo Quiz</h2>
          {QUIZ_TOPICS.map(topic => (
            <button
              key={topic.id}
              onClick={() => startQuiz(topic.id, topic.name)}
              disabled={creating}
              className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-red-300 hover:shadow-md transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                {topic.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{topic.desc}</p>
              </div>
              {creating ? (
                <Loader2 size={18} className="text-gray-400 animate-spin flex-shrink-0" />
              ) : (
                <ChevronRight size={18} className="text-gray-300 group-hover:text-red-500 transition-colors flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Topic-specific quizzes */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Por Tema (Try! N3)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {N3_TOPICS.map(topic => (
              <button
                key={topic.id}
                onClick={() => startQuiz(topic.id, topic.name)}
                disabled={creating}
                className="bg-white border border-gray-200 rounded-xl p-3 text-left hover:border-red-300 hover:shadow-sm transition-all flex items-start gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-800 leading-tight">{topic.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{topic.chapter}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-red-500 transition-colors flex-shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
