import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Agent, Conversation, Message } from "./types"

interface AppState {
  agents: Agent[]
  conversations: Conversation[]
  activeConversationId: string | null
  activeAgentId: string | null
  theme: "light" | "dark"
  sidebarOpen: boolean
  isLoaded: boolean

  loadFromDb: () => Promise<void>
  setActiveConversation: (id: string | null) => void
  setActiveAgent: (id: string | null) => void
  addConversation: (agentId: string) => Conversation
  addMessage: (conversationId: string, message: Omit<Message, "id" | "createdAt">, saveToDb?: boolean) => Message
  updateLastMessage: (conversationId: string, content: string) => void
  removeLastAssistantMessage: (conversationId: string) => void
  deleteConversation: (id: string) => void
  saveAgent: (agent: Agent) => void
  deleteAgent: (id: string) => void
  toggleTheme: () => void
  toggleSidebar: () => void
}

const api = (path: string, options?: RequestInit) =>
  fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  }).catch(console.error)

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      agents: [],
      conversations: [],
      activeConversationId: null,
      activeAgentId: null,
      theme: "light",
      sidebarOpen: true,
      isLoaded: false,

      loadFromDb: async () => {
        const [agentsData, convsData] = await Promise.all([
          fetch("/api/agents").then((r) => r.json()).catch(() => []),
          fetch("/api/conversations").then((r) => r.json()).catch(() => []),
        ])
        set({ agents: agentsData, conversations: convsData, isLoaded: true })
      },

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
        api("/api/conversations", {
          method: "POST",
          body: JSON.stringify({ id: newConv.id, agentId: newConv.agentId, title: newConv.title }),
        })
        return newConv
      },

      addMessage: (conversationId, message, saveToDb = false) => {
        const newMsg: Message = {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv
            const isFirstUserMsg = conv.messages.length === 0 && message.role === "user"
            const newTitle = isFirstUserMsg
              ? message.content.slice(0, 30) + (message.content.length > 30 ? "..." : "")
              : conv.title
            if (isFirstUserMsg) {
              api(`/api/conversations/${conversationId}`, {
                method: "PATCH",
                body: JSON.stringify({ title: newTitle }),
              })
            }
            return {
              ...conv,
              messages: [...conv.messages, newMsg],
              title: newTitle,
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
        if (saveToDb) {
          api("/api/messages", {
            method: "POST",
            body: JSON.stringify({
              id: newMsg.id,
              conversationId,
              role: newMsg.role,
              content: newMsg.content,
            }),
          })
        }
        return newMsg
      },

      updateLastMessage: (conversationId, content) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv
            const msgs = [...conv.messages]
            const last = msgs[msgs.length - 1]
            if (last && last.role === "assistant") {
              msgs[msgs.length - 1] = { ...last, content }
            }
            return { ...conv, messages: msgs, updatedAt: new Date().toISOString() }
          }),
        }))
      },

      removeLastAssistantMessage: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv
            const msgs = [...conv.messages]
            const last = msgs[msgs.length - 1]
            if (last && last.role === "assistant") {
              msgs.pop()
            }
            return { ...conv, messages: msgs, updatedAt: new Date().toISOString() }
          }),
        }))
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
        }))
        api(`/api/conversations/${id}`, { method: "DELETE" })
      },

      saveAgent: (agent) => {
        const exists = !!get().agents.find((a) => a.id === agent.id)
        set((state) => ({
          agents: exists
            ? state.agents.map((a) => (a.id === agent.id ? agent : a))
            : [agent, ...state.agents],
        }))
        if (exists) {
          api(`/api/agents/${agent.id}`, { method: "PUT", body: JSON.stringify(agent) })
        } else {
          api("/api/agents", { method: "POST", body: JSON.stringify(agent) })
        }
      },

      deleteAgent: (id) => {
        set((state) => ({ agents: state.agents.filter((a) => a.id !== id) }))
        api(`/api/agents/${id}`, { method: "DELETE" })
      },

      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: "agent-store",
      partialize: (s) => ({ theme: s.theme }),
    }
  )
)
