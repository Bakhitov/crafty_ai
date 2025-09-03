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
  const instanceName: string | undefined = body.instanceName;
  const botToken: string | undefined = body.botToken;

  if (!instanceName) {
    return new Response(
      JSON.stringify({ error: true, message: "instanceName is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  if (!botToken) {
    return new Response(
      JSON.stringify({ error: true, message: "botToken is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Create Telegram inbox directly in Chatwoot
  const res = await fetch(
    `${CHATWOOT_URL.replace(/\/$/, "")}/api/v1/accounts/${encodeURIComponent(String(CHATWOOT_ACCOUNT_ID))}/inboxes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        name: instanceName,
        channel: {
          type: "telegram",
          bot_token: botToken,
        },
      }),
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

  const conn = await ConnectionRepository.create({
    userId,
    type: "chatwoot_channel",
    displayName: instanceName,
    status: "open",
    chatwootAccountId: String(CHATWOOT_ACCOUNT_ID),
    chatwootInboxId: inboxId ? String(inboxId) : null,
    providerMetadata: { provider: "telegram" },
  });

  // Try to register per-connection webhook in Chatwoot (best-effort)
  try {
    if (BASE_URL && inboxId) {
      const webhookUrl = `${CHATWOOT_URL!.replace(/\/$/, "")}/api/v1/accounts/${encodeURIComponent(String(CHATWOOT_ACCOUNT_ID))}/webhooks`;
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          url: `${(process.env.NEXT_PUBLIC_BASE_URL || (env as any).NEXT_PUBLIC_BASE_URL).replace(/\/$/, "")}/api/webhooks/chatwoot/${conn.id}`,
          subscriptions: ["message_created"],
        }),
      }).catch(() => null);
    }
  } catch {}

  return new Response(JSON.stringify({ id: conn.id, inboxId }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
