import { ConnectionRepository } from "lib/db/pg/repositories/connection-repository.pg";
import { ChannelAgentMapRepository } from "lib/db/pg/repositories/channel-agent-map-repository.pg";
import { createOutgoingMessage } from "lib/services/chatwoot-bridge";
import { rememberAgentAction } from "../../../chat/actions";
import { customModelProvider } from "lib/ai/models";
import { generateText } from "ai";

// Простой авто-ответ агентом по вебхуку Chatwoot (минимальная версия)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ connectionId: string }> },
) {
  const { connectionId } = await params;
  const body = (await req.json().catch(() => ({}))) as any;

  // Проверим connection и inbox
  const conn = await ConnectionRepository.findById(connectionId).catch(
    () => null,
  );
  if (!conn || !conn.chatwootInboxId)
    return new Response("OK", { status: 200 });

  // Фильтруем только входящие сообщения
  const event = String(body?.event || body?.name || "").toLowerCase();
  const isIncoming =
    (event.includes("message") || event.includes("message_created")) &&
    String(
      body?.message_type || body?.message?.message_type || "incoming",
    ).toLowerCase() === "incoming";
  const conversationId = String(
    body?.conversation?.id ?? body?.conversation_id ?? "",
  );
  const text = String(body?.content ?? body?.message?.content ?? "").trim();
  if (!isIncoming || !conversationId || !text) {
    return new Response("OK", { status: 200 });
  }

  try {
    // Найти привязанного агента к inbox
    const mapping = await ChannelAgentMapRepository.findByInbox({
      userId: conn.userId,
      chatwootInboxId: conn.chatwootInboxId,
    });
    if (!mapping?.agentId) return new Response("OK", { status: 200 });

    // Поднять инструкции агента
    const agent = await rememberAgentAction(mapping.agentId, conn.userId);
    if (!agent) return new Response("OK", { status: 200 });

    // Сформировать system и сгенерировать ответ
    const systemParts: string[] = [];
    if (agent.instructions?.role) systemParts.push(agent.instructions.role);
    if (agent.instructions?.systemPrompt)
      systemParts.push(agent.instructions.systemPrompt);
    const systemPrompt = systemParts.filter(Boolean).join("\n\n");

    const model = await customModelProvider.getModelForUser(conn.userId);
    const { text: reply } = await generateText({
      model,
      system: systemPrompt || undefined,
      prompt: text,
    });
    const out = (reply || "").trim();
    if (!out) return new Response("OK", { status: 200 });

    // Ответить в Chatwoot
    await createOutgoingMessage({ conversationId, content: out });
  } catch {
    // ignore
  }

  return new Response("OK", { status: 200 });
}
