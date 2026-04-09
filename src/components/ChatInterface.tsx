'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Send, Loader2 } from 'lucide-react'
import { STUDY_PLAN, PHASE_LABELS, EXAM_DATE } from '@/lib/study-plan'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatInterfaceProps {
  sessionId: string
  initialMessages?: Message[]
  mode?: 'chat' | 'quiz' | 'review'
  topic?: string
  planDay?: number
}

function buildKickoffMessage(mode: string, topic?: string, planDay?: number): string {
  // Coming from the daily study plan
  if (planDay) {
    const day = STUDY_PLAN[planDay - 1]
    if (!day) return 'Empieza la sesión de hoy.'
    const modeLabel = { chat: 'clase de introducción', quiz: 'quiz', review: 'sesión de repaso' }[day.mode] ?? 'sesión'
    return (
      `Hola Tanaka-sensei. Hoy es el Día ${planDay} de 87 de mi plan de estudio para el JLPT N3 ` +
      `(examen el ${EXAM_DATE}). ` +
      `El tema de hoy es "${day.topicName}" — ${day.description}. ` +
      `Es una ${modeLabel}. Por favor empieza.`
    )
  }

  // Coming from quiz page — topic-specific
  if (topic === 'reading') return 'Por favor, comienza con un texto de comprensión lectora estilo JLPT N3.'
  if (topic === 'grammar')    return 'Empieza el quiz de gramática N3.'
  if (topic === 'vocabulary') return 'Empieza el quiz de vocabulario N3.'
  if (topic === 'kanji')      return 'Empieza el quiz de kanji N3.'
  if (topic === 'all')        return 'Empieza el quiz mixto N3.'
  if (topic?.startsWith('grammar-'))    return `Empieza el quiz de gramática N3 enfocado en: ${topic.replace('grammar-', '').replace(/-/g, ' ')}.`
  if (topic?.startsWith('vocabulary-')) return `Empieza el quiz de vocabulario N3 enfocado en: ${topic.replace('vocabulary-', '').replace(/-/g, ' ')}.`
  if (topic?.startsWith('kanji-'))      return `Empieza el quiz de kanji N3 enfocado en: ${topic.replace('kanji-', '').replace(/-/g, ' ')}.`

  // Review mode without topic
  if (mode === 'review') return 'Empieza la sesión de repaso N3.'

  return ''
}

export default function ChatInterface({ sessionId, initialMessages = [], mode = 'chat', topic, planDay }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const autoStartedRef = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    const assistantMessage: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, sessionId, mode, topic, planDay }),
      })

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const { text } = JSON.parse(data)
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + text,
                }
                return updated
              })
            } catch { /* ignore parse errors */ }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: 'Lo siento、エラーが発生しました。Please try again.',
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, sessionId, mode, topic, planDay])

  // Auto-start when session is new and has a topic or planDay
  useEffect(() => {
    if (autoStartedRef.current) return
    if (initialMessages.length > 0) return
    if (mode === 'chat' && !planDay && !topic) return

    const kickoff = buildKickoffMessage(mode, topic, planDay)
    if (!kickoff) return

    autoStartedRef.current = true
    const autoMsg: Message = { role: 'user', content: kickoff }
    const newMessages = [autoMsg]
    setMessages([autoMsg, { role: 'assistant', content: '' }])
    setIsLoading(true)

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages, sessionId, mode, topic, planDay }),
    }).then(async (response) => {
      if (!response.body) return
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const { text } = JSON.parse(data)
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: updated[updated.length - 1].content + text }
                return updated
              })
            } catch { /* ignore */ }
          }
        }
      }
    }).finally(() => setIsLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const modeLabel = {
    chat: '会話モード',
    quiz: 'クイズモード',
    review: '復習モード',
  }[mode]

  const modeBadgeColor = {
    chat: 'bg-blue-100 text-blue-700',
    quiz: 'bg-amber-100 text-amber-700',
    review: 'bg-green-100 text-green-700',
  }[mode]

  return (
    <div className="flex flex-col h-full">
      {/* Mode badge */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${modeBadgeColor}`}>
          {modeLabel}
        </span>
        {mode === 'quiz' && (
          <span className="text-xs text-gray-500">Tanaka-sensei te hará preguntas una por una</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-1">こんにちは！</p>
            <p className="text-sm">Pregúntame sobre gramática N3, vocabulario, kanji...</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-red-700 text-white flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0 mt-1">
                先
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-red-700 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-strong:text-gray-900">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content || (isLoading && i === messages.length - 1 ? '▌' : '')}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta en español o japonés..."
            rows={1}
            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent max-h-32"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 bg-red-700 text-white rounded-xl flex items-center justify-center hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 pl-1">Enter para enviar · Shift+Enter para nueva línea</p>
      </div>
    </div>
  )
}
