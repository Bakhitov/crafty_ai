import { getSession } from "lib/auth/server";
import { ConnectionRepository } from "lib/db/pg/repositories/connection-repository.pg";
import { ChannelAgentMapRepository } from "lib/db/pg/repositories/channel-agent-map-repository.pg";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const userId = session.user.id;
  const { id } = await params;

  const conn = await ConnectionRepository.findByIdAndUser(id, userId);
  if (!conn) return new Response("Not found", { status: 404 });
  if (!conn.chatwootInboxId)
    return new Response(JSON.stringify({ agentId: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  const row = await ChannelAgentMapRepository.findByInbox({
    userId,
    chatwootInboxId: conn.chatwootInboxId,
  });
  return new Response(JSON.stringify({ agentId: row?.agentId ?? null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const userId = session.user.id;
  const { id } = await params;
  const body = await req.json().catch(() => ({}) as any);
  const agentId: string | undefined = body?.agentId;

  const conn = await ConnectionRepository.findByIdAndUser(id, userId);
  if (!conn) return new Response("Not found", { status: 404 });
  if (!conn.chatwootInboxId)
    return new Response("Connection is not linked to Chatwoot inbox", {
      status: 400,
    });
  if (!agentId)
    return new Response(
      JSON.stringify({ error: true, message: "agentId is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );

  const row = await ChannelAgentMapRepository.upsert({
    userId,
    chatwootInboxId: conn.chatwootInboxId,
    agentId,
  });
  return new Response(JSON.stringify({ agentId: row.agentId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const userId = session.user.id;
  const { id } = await params;

  const conn = await ConnectionRepository.findByIdAndUser(id, userId);
  if (!conn) return new Response("Not found", { status: 404 });
  if (!conn.chatwootInboxId) return new Response(null, { status: 204 });

  await ChannelAgentMapRepository.delete({
    userId,
    chatwootInboxId: conn.chatwootInboxId,
  });
  return new Response(null, { status: 204 });
}
