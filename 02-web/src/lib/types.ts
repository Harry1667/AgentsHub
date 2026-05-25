// 建構師對話的哨兵 agentId：用來把「Agent 建構師」的討論與一般對話區隔，
// 不污染最近對話列表（免動 DB schema）。
export const BUILDER_AGENT_ID = "__builder__"

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
  actualProvider?: string  // 實際供應商（取代舊的 content 內 _via_ 後綴）
  actualModel?: string     // 實際模型
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
