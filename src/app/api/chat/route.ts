import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { PROFESSOR_SYSTEM_PROMPT, N3_TOPICS } from '@/lib/professor-prompt'
import { STUDY_PLAN, PHASE_LABELS, EXAM_DATE } from '@/lib/study-plan'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

function buildSystemPrompt(mode: string, topic?: string, planDay?: number): string {
  let prompt = PROFESSOR_SYSTEM_PROMPT

  // Add daily plan context when coming from the plan page
  if (planDay) {
    const day = STUDY_PLAN[planDay - 1]
    if (day) {
      prompt += `\n\n## CONTEXTO DEL PLAN DE ESTUDIO\n` +
        `El estudiante sigue un plan de 87 días para el JLPT N3 (examen: ${EXAM_DATE}).\n` +
        `Hoy es el Día ${planDay}/87. Fase ${day.phase}: ${PHASE_LABELS[day.phase]}.\n` +
        `Tema de hoy: "${day.topicName}" — ${day.description}.\n`

      if (day.mode === 'chat') {
        prompt +=
          `\n## ESTRUCTURA DE LA CLASE (OBLIGATORIA)\n` +
          `Conduce la clase EN PARTES. NUNCA expliques todo el tema de golpe. Sigue este flujo estricto:\n\n` +
          `**PARTE 1 — Introducción (solo el primer concepto del tema)**\n` +
          `- Explica UN solo patrón gramatical con claridad en español\n` +
          `- Da 2 ejemplos con traducción\n` +
          `- Termina con: "¿Listo para practicar? Intenta completar estas frases:" y pon 2-3 ejercicios de rellena el espacio\n` +
          `- ESPERA la respuesta del estudiante antes de continuar\n\n` +
          `**PARTE 2 — Corrección + siguiente concepto**\n` +
          `- Corrige los ejercicios con explicación breve\n` +
          `- Introduce el SIGUIENTE patrón del tema\n` +
          `- Termina con más ejercicios\n` +
          `- ESPERA la respuesta\n\n` +
          `**Repite** este ciclo (explica → ejercicio → corrige → siguiente) para cada patrón del tema.\n\n` +
          `**PARTE FINAL — Examen del día**\n` +
          `Cuando hayas cubierto todos los patrones del tema, di:\n` +
          `"¡Muy bien! Ya vimos todo el tema. Ahora vamos con el examen final del día 📝"\n` +
          `Luego haz un examen de 5 preguntas variadas sobre TODO lo visto hoy:\n` +
          `- Mezcla: rellena el espacio, elige la opción correcta, traduce la frase\n` +
          `- Una pregunta a la vez, espera la respuesta\n` +
          `- Al final da una nota: X/5 y un resumen de lo que dominó bien y lo que debe repasar\n\n` +
          `**REGLA CLAVE:** Nunca avances a la siguiente parte sin que el estudiante responda los ejercicios. ` +
          `Si el estudiante pregunta algo fuera del tema, responde brevemente y vuelve al flujo.\n\n` +
          `Empieza ahora con una bienvenida de una línea (menciona el día ${planDay}/87 y el tema) y arranca la PARTE 1.`
      } else if (day.mode === 'review') {
        prompt +=
          `\n## ESTRUCTURA DEL REPASO (OBLIGATORIA)\n` +
          `Es una sesión de repaso. Haz preguntas de práctica sobre "${day.topicName}", ` +
          `una a la vez. Corrige cada respuesta antes de continuar. ` +
          `Al final da un resumen de fortalezas y áreas a mejorar.`
      } else if (day.mode === 'quiz') {
        prompt +=
          `\n## ESTRUCTURA DEL QUIZ (OBLIGATORIA)\n` +
          `Haz un quiz de 8 preguntas sobre "${day.topicName}". ` +
          `Una pregunta a la vez, espera la respuesta, corrige y explica brevemente. ` +
          `Al final da la nota final X/8.`
      }
    }
  }

  if (mode === 'quiz') {
    // Look up the human-readable topic name if it's a specific N3 topic
    const topicInfo = N3_TOPICS.find(t => t.id === topic)
    const topicLabel = topicInfo?.name ?? topic

    if (topic === 'reading') {
      prompt += '\n\nMODE: quiz_mode\nTOPIC: Comprensión Lectora\nProporciona primero un texto corto en japonés estilo JLPT N3 (150-250 caracteres, con furigana). Luego haz 3-4 preguntas de comprensión sobre ese texto, una por una. Espera la respuesta del estudiante antes de continuar con la siguiente pregunta.'
    } else if (topic === 'kanji' || topic?.startsWith('kanji-')) {
      prompt += `\n\nMODE: quiz_mode\nTOPIC: ${topicLabel}\nHaz preguntas sobre kanji N3: lectura (音読み/訓読み), significado, uso en palabras compuestas. Una pregunta a la vez. Espera la respuesta antes de continuar.`
    } else if (topic === 'vocabulary' || topic?.startsWith('vocabulary-')) {
      prompt += `\n\nMODE: quiz_mode\nTOPIC: ${topicLabel}\nHaz preguntas de vocabulario N3 enfocadas en este tema: significado, uso en contexto, sinónimos/antónimos. Una pregunta a la vez. Espera la respuesta antes de continuar.`
    } else if (topic === 'grammar' || topic?.startsWith('grammar-')) {
      prompt += `\n\nMODE: quiz_mode\nTOPIC: ${topicLabel}\nHaz preguntas de gramática N3 específicamente sobre este punto gramatical: rellena el espacio en blanco, elige la opción correcta, o corrige el error. Una pregunta a la vez. Espera la respuesta antes de continuar.`
    } else {
      prompt += '\n\nMODE: quiz_mode\nTOPIC: Todo N3 (mixto)\nMezcla preguntas variadas de gramática, vocabulario y kanji N3. Una pregunta a la vez. Espera la respuesta antes de continuar.'
    }
  } else if (mode === 'review') {
    prompt += '\n\nMODE: review_mode\nEstás en modo repaso. Explica conceptos con claridad, da ejemplos y haz preguntas suaves para verificar comprensión. No hagas exámenes formales — enfócate en reforzar y aclarar el material.'
  }

  return prompt
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { messages, sessionId, mode, topic, planDay } = await req.json()

  // Persist user message
  const userMessage = messages[messages.length - 1]
  await supabase.from('messages').insert({
    session_id: sessionId,
    user_id: user.id,
    role: 'user',
    content: userMessage.content,
  })

  // Update session timestamp
  await supabase.from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  const systemPrompt = buildSystemPrompt(mode, topic, planDay)

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2048,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
  })

  const encoder = new TextEncoder()
  let fullResponse = ''

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            fullResponse += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        // Persist assistant response
        await supabase.from('messages').insert({
          session_id: sessionId,
          user_id: user.id,
          role: 'assistant',
          content: fullResponse,
        })

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
