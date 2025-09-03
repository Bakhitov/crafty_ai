import { getSession } from "lib/auth/server";
import { ConnectionRepository } from "lib/db/pg/repositories/connection-repository.pg";
import { load } from "lib/load-env";
import { buildChatwootAuthHeaders } from "lib/services/chatwoot-auth";

const env = load();

const CHATWOOT_URL = (process.env.CHATWOOT_URL || (env as any).CHATWOOT_URL) as
  | string
  | undefined;
const CHATWOOT_ACCOUNT_ID = (process.env.CHATWOOT_ACCOUNT_ID ||
  (env as any).CHATWOOT_ACCOUNT_ID) as string | undefined;
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ||
  (env as any).NEXT_PUBLIC_BASE_URL) as string | undefined;

export async function POST(request: Request) {
  const authHeaders = buildChatwootAuthHeaders();
  if (
    !CHATWOOT_URL ||
    !CHATWOOT_ACCOUNT_ID ||
    Object.keys(authHeaders).length === 0
  ) {
    return new Response("Chatwoot env not configured", { status: 500 });
  }

  const session = await getSession();
  const userId = session.user.id;

  const body = (await request.json().catch(() => ({}))) as any;
  const name: string | undefined = body?.name;
  const channel: Record<string, unknown> | undefined = body?.channel;

  if (!name) {
    return new Response(
      JSON.stringify({ error: true, message: "name is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  if (!channel || typeof channel !== "object" || !channel["type"]) {
    return new Response(
      JSON.stringify({ error: true, message: "channel.type is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const res = await fetch(
    `${CHATWOOT_URL.replace(/\/$/, "")}/api/v1/accounts/${encodeURIComponent(String(CHATWOOT_ACCOUNT_ID))}/inboxes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ name, channel }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: true, status: res.status, data }),
      {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const inboxId = data?.id ?? data?.payload?.id;
  const channelType = String(channel["type"] || "unknown");

  const conn = await ConnectionRepository.create({
    userId,
    type: "chatwoot_channel",
    displayName: name,
    status: "open",
    chatwootAccountId: String(CHATWOOT_ACCOUNT_ID),
    chatwootInboxId: inboxId ? String(inboxId) : null,
    providerMetadata: { provider: channelType, channel },
  });

  // Try to register per-connection webhook in Chatwoot (best-effort)
  try {
    if (BASE_URL && inboxId) {
      const webhookUrl = `${BASE_URL.replace(/\/$/, "")}/api/webhooks/chatwoot/${conn.id}`;
      await fetch(
        `${CHATWOOT_URL!.replace(/\/$/, "")}/api/v1/accounts/${encodeURIComponent(String(CHATWOOT_ACCOUNT_ID))}/webhooks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            url: webhookUrl,
            subscriptions: ["message_created"],
          }),
        },
      ).catch(() => null);
    }
  } catch {}

  return new Response(JSON.stringify({ id: conn.id, inboxId, channelType }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
