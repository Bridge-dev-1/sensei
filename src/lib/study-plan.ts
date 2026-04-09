export interface StudyDay {
  day: number
  date: string
  phase: 1 | 2 | 3 | 4
  topicId: string
  topicName: string
  mode: 'chat' | 'quiz' | 'review'
  description: string
}

export const PLAN_START = '2026-04-09'
export const EXAM_DATE = '2026-07-05'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function getDaysUntilExam(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = new Date(EXAM_DATE)
  return Math.max(0, Math.round((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
}

export function getTodayDayNumber(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(PLAN_START)
  const diff = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.min(Math.max(diff + 1, 1), 87)
}

function generatePlan(): StudyDay[] {
  const days: StudyDay[] = []
  let dayNum = 1

  function addDay(
    topicId: string,
    topicName: string,
    mode: 'chat' | 'quiz' | 'review',
    phase: 1 | 2 | 3 | 4,
    description: string
  ) {
    days.push({
      day: dayNum,
      date: addDays(PLAN_START, dayNum - 1),
      phase,
      topicId,
      topicName,
      mode,
      description,
    })
    dayNum++
  }

  // ── Phase 1: Gramática (Days 1–35) ──────────────────────────────────
  // 10 topics × 3 days + 5 repaso = 35 days
  const grammarTopics = [
    { id: 'grammar-time',        name: 'Tiempo y Secuencia',       note: 'てから・前に・後で・ながら' },
    { id: 'grammar-conditional', name: 'Condicionales',            note: 'と・ば・たら・なら' },
    { id: 'grammar-manner',      name: 'Modo y Grado',             note: 'ように・ほど・くらい・だけ' },
    { id: 'grammar-reason',      name: 'Causa y Razón',            note: 'ため・せいで・おかげで' },
    { id: 'grammar-contrast',    name: 'Contraste y Concesión',    note: 'のに・くせに・ものの' },
    { id: 'grammar-expectation', name: 'Expectativa y Obligación', note: 'はずだ・べきだ・にちがいない' },
    { id: 'grammar-change',      name: 'Cambio',                   note: 'ことになる・ようになる' },
    { id: 'grammar-auxiliary',   name: 'Verbos Auxiliares',        note: 'てしまう・ておく・てある' },
    { id: 'grammar-passive',     name: 'Pasiva y Causativa',       note: 'られる・させる・させられる' },
    { id: 'grammar-formal',      name: 'Expresiones Formales',     note: 'によって・に対して・において' },
  ]

  grammarTopics.forEach((t, i) => {
    addDay(t.id, t.name, 'chat',   1, `Introducción: ${t.note}`)
    addDay(t.id, t.name, 'review', 1, `Práctica: ${t.note}`)
    addDay(t.id, t.name, 'quiz',   1, `Quiz: ${t.name}`)
    if ((i + 1) % 2 === 0) {
      addDay('grammar', 'Repaso de Gramática', 'review', 1, 'Repaso mixto de los últimos dos temas')
    }
  })

  // ── Phase 2: Vocabulario (Days 36–56) ────────────────────────────────
  // 3 topics × (5 días + 2 repaso) = 21 days
  const vocabTopics = [
    { id: 'vocabulary-daily',    name: 'Vida Cotidiana',      note: 'Palabras de uso diario' },
    { id: 'vocabulary-work',     name: 'Trabajo y Sociedad',  note: 'Vocabulario laboral y social' },
    { id: 'vocabulary-compound', name: 'Palabras Compuestas', note: 'Compuestos y expresiones' },
  ]

  vocabTopics.forEach((t) => {
    addDay(t.id, t.name, 'chat',   2, `Introducción: ${t.note}`)
    addDay(t.id, t.name, 'chat',   2, `Profundización: ${t.note}`)
    addDay(t.id, t.name, 'review', 2, `Práctica: ${t.note}`)
    addDay(t.id, t.name, 'review', 2, `Repaso: ${t.note}`)
    addDay(t.id, t.name, 'quiz',   2, `Quiz: ${t.name}`)
    addDay('vocabulary', 'Repaso de Vocabulario', 'review', 2, 'Repaso y tarjetas de vocabulario')
    addDay('vocabulary', 'Repaso de Vocabulario', 'review', 2, 'Vocabulario en contexto y frases')
  })

  // ── Phase 3: Kanji (Days 57–70) ──────────────────────────────────────
  // 2 topics × (5 días + 2 repaso) = 14 days
  const kanjiTopics = [
    { id: 'kanji-basic',    name: 'Kanji N3: Básico (1-100)',    note: 'Primeros 100 kanji N3' },
    { id: 'kanji-advanced', name: 'Kanji N3: Avanzado (101-370)', note: 'Kanji 101-370 N3' },
  ]

  kanjiTopics.forEach((t) => {
    addDay(t.id, t.name, 'chat',   3, `Introducción: ${t.note}`)
    addDay(t.id, t.name, 'chat',   3, `Profundización: ${t.note}`)
    addDay(t.id, t.name, 'review', 3, `Práctica de lectura`)
    addDay(t.id, t.name, 'review', 3, `Kanji en contexto`)
    addDay(t.id, t.name, 'quiz',   3, `Quiz: ${t.name}`)
    addDay('kanji', 'Repaso de Kanji', 'review', 3, 'Repaso de todos los kanji estudiados')
    addDay('kanji', 'Repaso de Kanji', 'quiz',   3, 'Quiz mixto de kanji')
  })

  // ── Phase 4: Comprensión + Repaso Final (Days 71–84) ─────────────────
  // 7 días lectura + 7 días simulacro = 14 days
  for (let i = 0; i < 7; i++) {
    addDay('reading', 'Comprensión Lectora', i % 2 === 0 ? 'chat' : 'quiz', 4,
      `Texto estilo JLPT N3 — Sesión ${i + 1}`)
  }
  for (let i = 0; i < 7; i++) {
    addDay('all', 'Simulacro Completo N3', i % 3 === 2 ? 'quiz' : 'review', 4,
      `Repaso completo — Sesión ${i + 1}`)
  }

  // ── Días finales 85–87 ────────────────────────────────────────────────
  addDay('all', 'Repaso Final', 'review', 4, 'Repaso ligero — no material nuevo')
  addDay('all', 'Repaso Final', 'review', 4, 'Relee tus notas y errores frecuentes')
  addDay('all', 'Repaso Final', 'review', 4, '¡Día antes del examen! Descansa y confía en ti 頑張って！')

  return days
}

export const STUDY_PLAN: StudyDay[] = generatePlan()

export const PHASE_LABELS: Record<number, string> = {
  1: 'Gramática',
  2: 'Vocabulario',
  3: 'Kanji',
  4: 'Comprensión y Repaso Final',
}

export const PHASE_COLORS: Record<number, string> = {
  1: 'blue',
  2: 'green',
  3: 'purple',
  4: 'red',
}
