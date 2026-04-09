export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  session_id: string
}

export interface ChatSession {
  id: string
  user_id: string
  title: string
  mode: 'chat' | 'quiz' | 'review'
  created_at: string
  updated_at: string
}

export interface QuizResult {
  id: string
  user_id: string
  topic_id: string
  score: number
  total: number
  created_at: string
}

export interface StudyProgress {
  id: string
  user_id: string
  topic_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  last_studied_at: string | null
}

export interface Profile {
  id: string
  email: string
  display_name: string | null
  current_level: string
  target_level: string
  created_at: string
}
