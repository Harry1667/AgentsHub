import { ChatInterface } from "@/components/chat-interface"

export default async function ConvPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ChatInterface conversationId={id} />
}
