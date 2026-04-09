# N3 先生 — Contexto del Proyecto

## Que es

App web de tutoria para estudiar japones nivel JLPT N3. Esta dirigida a estudiantes que vienen del N4 y quieren avanzar al N3. El AI actua como un profesor llamado **Tanaka-sensei**, responde en español e integra ejemplos en japones.

**Fecha de ultimo analisis:** 2026-04-08

---

## Stack

| Capa | Tecnologia |
|------|-----------|
| Frontend | Next.js 16.2.2 (App Router), React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes |
| Base de datos | Supabase (PostgreSQL) con RLS |
| Auth | Supabase Auth (email/password) |
| IA | Anthropic Claude Sonnet 4.6 (streaming) |
| Iconos | Lucide React |
| Markdown | react-markdown + remark-gfm |

---

## Estructura de rutas

| Ruta | Descripcion |
|------|-------------|
| `/` | Landing page estatica con descripcion de la app |
| `/login` | Registro e inicio de sesion con Supabase |
| `/dashboard` | Panel principal: estadisticas, progreso, acceso rapido |
| `/chat` | Chat con Tanaka-sensei (modos: Chat, Quiz, Review) |
| `/quiz` | Seleccion de quizzes por tipo y tema |
| `/progress` | Progreso detallado con identificacion de areas debiles |
| `/auth/callback` | Callback de OAuth de Supabase |

### API Routes

| Ruta | Metodo | Funcion |
|------|--------|---------|
| `/api/chat` | POST | Streaming de respuestas Claude, guarda mensajes en DB |
| `/api/sessions` | GET | Lista sesiones del usuario |
| `/api/sessions` | POST | Crea nueva sesion |
| `/api/sessions/[id]/messages` | GET | Mensajes de una sesion |
| `/api/progress` | GET | Obtiene progreso y resultados de quizzes |
| `/api/progress` | POST | Actualiza el estado de un tema |

---

## Base de datos (Supabase)

Schema completo en `supabase-schema.sql`.

### Tablas

**`profiles`**
```sql
id uuid (PK, ref auth.users)
email text
display_name text
current_level text  -- default 'N4'
target_level text   -- default 'N3'
created_at timestamptz
```

**`chat_sessions`**
```sql
id uuid (PK)
user_id uuid (ref auth.users)
title text
mode text  -- 'chat' | 'quiz' | 'review'
created_at timestamptz
updated_at timestamptz  -- auto-updated por trigger
```

**`messages`**
```sql
id uuid (PK)
session_id uuid (ref chat_sessions)
user_id uuid (ref auth.users)
role text  -- 'user' | 'assistant'
content text
created_at timestamptz
```

**`quiz_results`**
```sql
id uuid (PK)
user_id uuid (ref auth.users)
topic_id text
score integer
total integer
created_at timestamptz
```

**`study_progress`**
```sql
id uuid (PK)
user_id uuid (ref auth.users)
topic_id text
status text  -- 'not_started' | 'in_progress' | 'completed'
last_studied_at timestamptz
UNIQUE(user_id, topic_id)
```

### Triggers

- `on_auth_user_created` — crea perfil automaticamente al registrarse
- `update_chat_sessions_updated_at` — actualiza `updated_at` en cada UPDATE

### Seguridad

Todas las tablas tienen RLS habilitado. Los usuarios solo pueden ver y modificar sus propios datos.

---

## Variables de entorno requeridas

Archivo: `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=          # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Anon key publica de Supabase
SUPABASE_SERVICE_ROLE_KEY=         # Service role key (actualmente no usada en codigo)
ANTHROPIC_API_KEY=                 # API key de Anthropic
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Estado actual:** El archivo `.env.local` existe pero todas las keys son placeholders (`your_*`).

---

## Curriculo N3 implementado

16 temas organizados por categoria, basados en Try! N3, Nihongo So-Matome N3, Kanzen Master N3 y JLPT Tango N3.

### Gramatica (10 temas)
1. Tiempo y secuencia
2. Condicionales
3. Manera y grado
4. Causa y razon
5. Contraste y concesion
6. Expectativa y obligacion
7. Cambio
8. Verbos auxiliares
9. Pasiva y causativa
10. Expresiones formales

### Vocabulario (3 temas)
11. Vida cotidiana
12. Trabajo y sociedad
13. Palabras compuestas

### Kanji (2 temas)
14. Kanji basico (1-100)
15. Kanji avanzado (101-370)

### Lectura (1 tema)
16. Comprension lectora

---

## Componentes

| Archivo | Estado | Descripcion |
|---------|--------|-------------|
| `src/components/ChatInterface.tsx` | Usado | Chat con streaming y render Markdown |
| `src/components/Navigation.tsx` | Usado | Nav con auth-awareness y logout |
| `src/components/TopicCard.tsx` | **No usado** | Definido pero nunca importado |

---

## Lo que esta funcionando

- Flujo de autenticacion completo (signup → login → logout → rutas protegidas)
- Chat con streaming en tiempo real via Anthropic
- Persistencia de mensajes en Supabase
- Creacion y listado de sesiones
- Dashboard con datos reales de la DB
- Tracking de progreso por tema
- Quizzes con seleccion de tipo y tema
- Tipos TypeScript consistentes en todo el proyecto
- UI responsive (mobile y desktop)

---

## Lo que falta o esta roto

### Blockers criticos (la app no corre sin esto)

- [ ] **Variables de entorno** — Configurar `.env.local` con valores reales de Supabase y Anthropic
- [ ] **Schema de base de datos** — Ejecutar `supabase-schema.sql` en el SQL Editor de Supabase

### Problemas de logica

- [ ] **Middleware no conectado** — `src/proxy.ts` tiene logica de auth pero no esta registrado como middleware de Next.js (`middleware.ts` en la raiz). Las rutas protegidas solo se validan a nivel de pagina, no globalmente.
- [ ] **`quizTopic` query param sin efecto** — En `/chat?quizTopic=X` el parametro se lee pero no pre-selecciona ni filtra nada en la UI del quiz.

### Codigo muerto

- [ ] **`TopicCard` component** — Definido en `src/components/TopicCard.tsx` pero nunca importado ni usado.
- [ ] **`SUPABASE_SERVICE_ROLE_KEY`** — Esta en el `.env.local` pero ninguna API route la usa. Si se necesitan operaciones admin en el futuro, ya esta declarada.

---

## Para hacer funcionar la app desde cero

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Ir al SQL Editor y ejecutar el contenido de `supabase-schema.sql`
3. Copiar las keys del proyecto Supabase (URL, anon key, service role key)
4. Crear una API key en [console.anthropic.com](https://console.anthropic.com)
5. Pegar todo en `.env.local`
6. Correr `npm install` (ya esta hecho si el repo esta clonado)
7. Correr `npm run dev`

---

## Para completar la app (backlog)

- [ ] Registrar `src/proxy.ts` como middleware global (`middleware.ts` en raiz)
- [ ] Implementar el filtrado por `quizTopic` en el chat y en la pagina de quiz
- [ ] Usar o eliminar `TopicCard` component
- [ ] Agregar guardado de resultados de quiz en la DB desde la UI (actualmente el endpoint existe pero no hay boton/flujo claro para triggerearlo desde el quiz)
- [ ] Agregar pagina de perfil para que el usuario pueda cambiar su `display_name`
- [ ] Considerar si `SUPABASE_SERVICE_ROLE_KEY` se necesita o se puede eliminar del env
