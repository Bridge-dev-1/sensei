import Link from 'next/link'
import { BookOpen, MessageCircle, Pencil, BarChart2 } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex flex-col">
      <div className="max-w-5xl mx-auto px-4 py-16 flex-1 flex flex-col items-center justify-center text-center">
        <div className="mb-4 inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-sm font-medium">
          <span>🇯🇵</span> JLPT N3 対策
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          N3 <span className="text-red-700">先生</span>
        </h1>
        <p className="text-xl text-gray-600 mb-3 max-w-xl">
          Tu profesor de japonés IA para pasar del N4 al N3
        </p>
        <p className="text-sm text-gray-500 mb-10 max-w-lg">
          Basado en <strong>Try! N3</strong>, Nihongo So-Matome N3, Kanzen Master N3 y JLPT Tango N3.
          Gramática, vocabulario, kanji y comprensión lectora.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-16">
          <Link
            href="/login"
            className="px-8 py-3 bg-red-700 text-white rounded-xl font-semibold hover:bg-red-800 transition-colors shadow-md"
          >
            始めましょう — Empezar
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
          {[
            { icon: MessageCircle, title: 'Profesor IA', desc: 'Tanaka-sensei te explica gramática y resuelve dudas en español' },
            { icon: Pencil, title: 'Quizzes N3', desc: 'Preguntas tipo JLPT: gramática, vocabulario, kanji y lectura' },
            { icon: BarChart2, title: 'Progreso', desc: 'Rastrea tu avance por tema y detecta áreas débiles' },
            { icon: BookOpen, title: 'Curriculum', desc: 'Try! N3 como base + 3 libros de referencia adicionales' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-5 text-left border border-gray-200 shadow-sm">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3">
                <Icon size={20} className="text-red-700" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-center py-4 text-xs text-gray-400">
        Powered by Claude AI · Supabase · Next.js
      </footer>
    </main>
  )
}
