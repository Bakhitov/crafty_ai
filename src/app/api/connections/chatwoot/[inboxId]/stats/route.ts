import { load } from "lib/load-env";
import { buildChatwootAuthHeaders } from "lib/services/chatwoot-auth";

const env = load();
const CHATWOOT_URL = (process.env.CHATWOOT_URL || (env as any).CHATWOOT_URL) as
  | string
  | undefined;
const CHATWOOT_ACCOUNT_ID = (process.env.CHATWOOT_ACCOUNT_ID ||
  (env as any).CHATWOOT_ACCOUNT_ID) as string | undefined;

function baseUrl() {
  if (!CHATWOOT_URL) throw new Error("CHATWOOT_URL is not configured");
  return CHATWOOT_URL.replace(/\/$/, "");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ inboxId: string }> },
) {
  const { inboxId } = await params;
  const headers = {
    "Content-Type": "application/json",
    ...buildChatwootAuthHeaders(),
  } as HeadersInit;
  if (!CHATWOOT_ACCOUNT_ID || Object.keys(headers).length === 0)
    return new Response("Chatwoot env not configured", { status: 500 });

  // Inbox info
  const inboxRes = await fetch(
    `${baseUrl()}/api/v1/accounts/${encodeURIComponent(String(CHATWOOT_ACCOUNT_ID))}/inboxes/${encodeURIComponent(inboxId)}`,
    { headers },
  );
  const inbox = await inboxRes.json().catch(() => ({}));

  // Conversations (basic count, first page as fallback)
  const convRes = await fetch(
    `${baseUrl()}/api/v1/accounts/${encodeURIComponent(String(CHATWOOT_ACCOUNT_ID))}/conversations?inbox_id=${encodeURIComponent(inboxId)}&page=1`,
    { headers },
  );
  const conv = await convRes.json().catch(() => ({}));
  const conversationsCount = Array.isArray(conv?.data || conv)
    ? (conv?.data?.length ?? conv.length)
    : (conv?.meta?.count ?? 0);

  // Contacts: Chatwoot API может требовать фильтры/страницы; как простой снэпшот — page 1
  const contactsRes = await fetch(
    `${baseUrl()}/api/v1/accounts/${encodeURIComponent(String(CHATWOOT_ACCOUNT_ID))}/contacts?inbox_id=${encodeURIComponent(inboxId)}&page=1`,
    { headers },
  ).catch(() => null);
  const contacts = contactsRes
    ? await contactsRes.json().catch(() => ({}))
    : {};
  const contactsCount = Array.isArray(contacts?.payload || contacts?.data)
    ? (contacts?.payload?.length ?? contacts?.data?.length ?? 0)
    : (contacts?.meta?.count ?? 0);

  return new Response(
    JSON.stringify({ inbox, summaries: { conversationsCount, contactsCount } }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
