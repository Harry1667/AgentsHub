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
  agentId?: string  // assistant 訊息：發言的 agent（會議模式區分頭像）
}

export interface Conversation {
  id: string
  agentId: string
  participantIds?: string[]  // 會議參與者（含主 agent）；空或未定義時視為單 agent
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  systemPromptOverride?: string
}
