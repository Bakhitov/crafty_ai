import { getSession } from "lib/auth/server";
import { ConnectionRepository } from "lib/db/pg/repositories/connection-repository.pg";
import { load } from "lib/load-env";

const env = load();

const CHATWOOT_URL = (process.env.CHATWOOT_URL || (env as any).CHATWOOT_URL) as
  | string
  | undefined;
const CHATWOOT_ACCOUNT_ID = (process.env.CHATWOOT_ACCOUNT_ID ||
  (env as any).CHATWOOT_ACCOUNT_ID) as string | undefined;
const CHATWOOT_TOKEN = (process.env.CHATWOOT_TOKEN ||
  (env as any).CHATWOOT_TOKEN) as string | undefined;

export async function POST(request: Request) {
  if (!CHATWOOT_URL || !CHATWOOT_ACCOUNT_ID || !CHATWOOT_TOKEN) {
    return new Response("Chatwoot env not configured", { status: 500 });
  }

  const session = await getSession();
  const userId = session.user.id;

  const body = (await request.json().catch(() => ({}))) as any;
  const inboxIdRaw: string | number | undefined = body?.inboxId;
  const displayName: string | undefined = body?.displayName;

  if (!inboxIdRaw) {
    return new Response(
      JSON.stringify({ error: true, message: "inboxId is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const inboxId = String(inboxIdRaw);

  // Validate inbox exists in Chatwoot and get its details
  const listRes = await fetch(
    `${CHATWOOT_URL.replace(/\/$/, "")}/api/v1/accounts/${encodeURIComponent(String(CHATWOOT_ACCOUNT_ID))}/inboxes`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${CHATWOOT_TOKEN}` },
    },
  );
  const listData = await listRes.json().catch(() => ({}) as any);
  if (!listRes.ok || !Array.isArray(listData?.payload)) {
    return new Response(
      JSON.stringify({ error: true, status: listRes.status, data: listData }),
      {
        status: listRes.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const found = listData.payload.find((i: any) => String(i.id) === inboxId);
  if (!found) {
    return new Response(
      JSON.stringify({ error: true, message: "Inbox not found in Chatwoot" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const provider = (() => {
    const ct = String(found.channel_type || "").toLowerCase();
    if (ct.includes("telegram")) return "telegram";
    if (ct.includes("whatsapp")) return "whatsapp_api";
    if (ct.includes("facebook")) return "facebook";
    if (ct.includes("instagram")) return "instagram";
    if (ct.includes("line")) return "line";
    if (ct.includes("sms")) return "sms";
    if (ct.includes("email")) return "email";
    if (ct.includes("webwidget") || ct.includes("web_widget")) return "widget";
    if (ct.includes("api")) return "api";
    return "unknown";
  })();

  const conn = await ConnectionRepository.create({
    userId,
    type: "chatwoot_channel",
    displayName: displayName || found.name || `Inbox ${inboxId}`,
    status: "open",
    chatwootAccountId: String(CHATWOOT_ACCOUNT_ID),
    chatwootInboxId: inboxId,
    providerMetadata: {
      provider,
      chatwoot: {
        id: inboxId,
        name: found.name,
        channel_type: found.channel_type,
      },
    },
  });

  return new Response(JSON.stringify({ id: conn.id, inboxId }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
