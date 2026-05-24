export interface Agent {
  id: string
  name: string
  avatar: string
  description: string
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  tags: string[]
  useCount?: number
  isDefault?: boolean
  pinned?: boolean
  color?: string
  createdAt: string
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
  bookmarked?: boolean
}

export interface Conversation {
  id: string
  agentId: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  systemPromptOverride?: string
}
