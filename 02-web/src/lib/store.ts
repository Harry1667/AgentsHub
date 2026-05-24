import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Agent, Conversation, Message } from "./types"
import { DEFAULT_AGENTS, DEFAULT_CONVERSATIONS } from "./mock-data"

interface AppState {
  agents: Agent[]
  conversations: Conversation[]
  activeConversationId: string | null
  activeAgentId: string | null
  theme: "light" | "dark"
  sidebarOpen: boolean

  setActiveConversation: (id: string | null) => void
  setActiveAgent: (id: string | null) => void
  addConversation: (agentId: string) => Conversation
  addMessage: (conversationId: string, message: Omit<Message, "id" | "createdAt">) => void
  updateLastMessage: (conversationId: string, content: string) => void
  deleteConversation: (id: string) => void
  saveAgent: (agent: Agent) => void
  deleteAgent: (id: string) => void
  toggleTheme: () => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      agents: DEFAULT_AGENTS,
      conversations: DEFAULT_CONVERSATIONS,
      activeConversationId: null,
      activeAgentId: null,
      theme: "light",
      sidebarOpen: true,

      setActiveConversation: (id) => set({ activeConversationId: id }),
      setActiveAgent: (id) => set({ activeAgentId: id }),

      addConversation: (agentId) => {
        const agent = get().agents.find((a) => a.id === agentId)
        const newConv: Conversation = {
          id: `conv-${Date.now()}`,
          agentId,
          title: `與 ${agent?.name || "Agent"} 的對話`,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          conversations: [newConv, ...state.conversations],
          activeConversationId: newConv.id,
        }))
        return newConv
      },

      addMessage: (conversationId, message) => {
        const newMsg: Message = {
          ...message,
          id: `msg-${Date.now()}`,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, newMsg],
                  title:
                    conv.messages.length === 0 && message.role === "user"
                      ? message.content.slice(0, 30) + (message.content.length > 30 ? "..." : "")
                      : conv.title,
                  updatedAt: new Date().toISOString(),
                }
              : conv
          ),
        }))
      },

      updateLastMessage: (conversationId, content) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv
            const messages = [...conv.messages]
            const last = messages[messages.length - 1]
            if (last && last.role === "assistant") {
              messages[messages.length - 1] = { ...last, content }
            }
            return { ...conv, messages, updatedAt: new Date().toISOString() }
          }),
        }))
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
        }))
      },

      saveAgent: (agent) => {
        set((state) => {
          const exists = state.agents.find((a) => a.id === agent.id)
          return {
            agents: exists
              ? state.agents.map((a) => (a.id === agent.id ? agent : a))
              : [agent, ...state.agents],
          }
        })
      },

      deleteAgent: (id) => {
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
        }))
      },

      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    { name: "agent-store", partialize: (s) => ({ agents: s.agents, conversations: s.conversations, theme: s.theme }) }
  )
)
