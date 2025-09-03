import { getSession } from "lib/auth/server";
import { ConnectionRepository } from "lib/db/pg/repositories/connection-repository.pg";

export async function GET() {
  const session = await getSession();
  const userId = session.user.id;
  const rows = await ConnectionRepository.listByUser(userId);
  // mask secrets by omission
  const result = rows.map((r) => ({
    id: r.id,
    type: r.type,
    displayName: r.displayName,
    status: r.status,
    evolutionInstanceName: r.evolutionInstanceName,
    chatwootAccountId: r.chatwootAccountId,
    chatwootInboxId: r.chatwootInboxId,
    provider: (r.providerMetadata as any)?.provider || null,
    phone: (r.providerMetadata as any)?.phone || null,
    stats: (r.providerMetadata as any)?.stats || null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
