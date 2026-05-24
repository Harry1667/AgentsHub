"use client"

import { useAppStore } from "@/lib/store"
import { AgentForm } from "@/components/agent-form"
import { use } from "react"

export default function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const agents = useAppStore((s) => s.agents)
  const agent = agents.find((a) => a.id === id)
  return <AgentForm existingAgent={agent} />
}
