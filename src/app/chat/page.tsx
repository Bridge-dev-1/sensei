'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import ChatInterface from '@/components/ChatInterface'
import { Plus, MessageCircle, Pencil, BookOpen, Loader2 } from 'lucide-react'
import type { ChatSession, Message } from '@/types'

function ChatPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [initialMessages, setInitialMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const sessionId = searchParams.get('session')
  const quizTopic = searchParams.get('quizTopic') ?? undefined
  const planDay = searchParams.get('planDay') ? Number(searchParams.get('planDay')) : undefined

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      const session = sessions.find(s => s.id === sessionId)
      if (session) {
        selectSession(session)
      }
    }
  }, [sessionId, sessions])

  const fetchSessions = async () => {
    const res = await fetch('/api/sessions')
    const data = await res.json()
    setSessions(data)
    setLoading(false)
    if (!sessionId && data.length > 0) {
      selectSession(data[0])
    }
  }

  const selectSession = async (session: ChatSession) => {
    setActiveSession(session)
    router.replace(`/chat?session=${session.id}`, { scroll: false })
    const res = await fetch(`/api/sessions/${session.id}/messages`)
    const msgs = await res.json()
    setInitialMessages(msgs)
  }

  const createSession = async (mode: 'chat' | 'quiz' | 'review') => {
    setCreating(true)
    const titles = {
      chat: 'Conversación con Tanaka-sensei',
      quiz: 'Quiz N3',
      review: 'Sesión de repaso',
    }
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titles[mode], mode }),
    })
    const newSession = await res.json()
    setSessions(prev => [newSession, ...prev])
    setActiveSession(newSession)
    setInitialMessages([])
    router.replace(`/chat?session=${newSession.id}`, { scroll: false })
    setCreating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <Loader2 className="animate-spin text-red-700" size={24} />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 hidden sm:flex">
        <div className="p-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Nueva sesión</p>
          <div className="space-y-1">
            {[
              { mode: 'chat' as const, icon: MessageCircle, label: 'Conversación', color: 'text-blue-700' },
              { mode: 'quiz' as const, icon: Pencil, label: 'Quiz N3', color: 'text-amber-700' },
              { mode: 'review' as const, icon: BookOpen, label: 'Repaso', color: 'text-green-700' },
            ].map(({ mode, icon: Icon, label, color }) => (
              <button
                key={mode}
                onClick={() => createSession(mode)}
                disabled={creating}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Plus size={14} className="text-gray-400" />
                <Icon size={14} className={color} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4 px-2">No hay sesiones aún</p>
          ) : (
            <div className="space-y-1">
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => selectSession(session)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeSession?.id === session.id ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(session.updated_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeSession ? (
          <ChatInterface
            sessionId={activeSession.id}
            initialMessages={initialMessages.map(m => ({ role: m.role, content: m.content }))}
            mode={activeSession.mode as 'chat' | 'quiz' | 'review'}
            topic={quizTopic}
            planDay={planDay}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <MessageCircle size={48} className="mb-4 text-gray-200" />
            <p className="text-lg font-medium text-gray-600 mb-2">こんにちは！</p>
            <p className="text-sm mb-6">Crea una nueva sesión para empezar</p>
            <div className="flex flex-col sm:flex-row gap-2">
              {[
                { mode: 'chat' as const, label: '💬 Conversar', color: 'bg-blue-600' },
                { mode: 'quiz' as const, label: '✏️ Quiz N3', color: 'bg-amber-600' },
                { mode: 'review' as const, label: '📚 Repasar', color: 'bg-green-600' },
              ].map(({ mode, label, color }) => (
                <button
                  key={mode}
                  onClick={() => createSession(mode)}
                  className={`${color} text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Suspense fallback={<div className="flex items-center justify-center h-[calc(100vh-56px)]"><Loader2 className="animate-spin text-red-700" size={24} /></div>}>
        <ChatPageContent />
      </Suspense>
    </div>
  )
}
