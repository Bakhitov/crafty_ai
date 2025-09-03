import { load } from "lib/load-env";
import { buildChatwootAuthHeaders } from "./chatwoot-auth";

const env = load();

const CHATWOOT_URL = (process.env.CHATWOOT_URL || (env as any).CHATWOOT_URL) as
  | string
  | undefined;
const CHATWOOT_ACCOUNT_ID = (process.env.CHATWOOT_ACCOUNT_ID ||
  (env as any).CHATWOOT_ACCOUNT_ID) as string | undefined;

function baseUrl(): string {
  if (!CHATWOOT_URL) throw new Error("CHATWOOT_URL is not configured");
  return CHATWOOT_URL.replace(/\/$/, "");
}

function headers(): HeadersInit {
  const h = buildChatwootAuthHeaders();
  if (!h || Object.keys(h).length === 0)
    throw new Error("Chatwoot auth headers are not configured");
  return { "Content-Type": "application/json", ...h } as HeadersInit;
}

export type EnsureContactResult = { contactId: number };

export async function ensureContact(options: {
  accountId?: string | number;
  name?: string;
  phone?: string;
  sourceId?: string; // external id (e.g., phone)
  inboxId: number | string;
}): Promise<EnsureContactResult> {
  const accountId = String(options.accountId ?? CHATWOOT_ACCOUNT_ID);
  // Create contact
  const resp = await fetch(
    `${baseUrl()}/api/v1/accounts/${encodeURIComponent(accountId)}/contacts`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        name: options.name || options.phone || "Unknown",
        phone_number: options.phone
          ? `+${options.phone.replace(/^\+/, "")}`
          : undefined,
        identifier: options.sourceId || options.phone || undefined,
      }),
    },
  );
  const data = await resp.json().catch(() => ({}) as any);
  if (!resp.ok)
    throw new Error(`Chatwoot create contact failed: ${resp.status}`);
  const contactId: number =
    data?.id ?? data?.payload?.contact?.id ?? data?.payload?.id;
  if (!contactId) throw new Error("Chatwoot contactId not returned");
  return { contactId };
}

export async function findExistingConversation(
  accountId: string | number,
  contactId: number,
  inboxId: number | string,
): Promise<number | null> {
  const res = await fetch(
    `${baseUrl()}/api/v1/accounts/${encodeURIComponent(String(accountId))}/contacts/${encodeURIComponent(String(contactId))}/conversations`,
    {
      method: "GET",
      headers: headers(),
    },
  );
  const data = await res.json().catch(() => ({}) as any);
  if (!res.ok) return null;
  const list: any[] = Array.isArray(data) ? data : data?.payload || [];
  const open = list.find(
    (c) => String(c.inbox_id) === String(inboxId) && c.status !== "resolved",
  );
  return open?.id ?? null;
}

export async function ensureConversation(options: {
  accountId?: string | number;
  contactId: number;
  inboxId: number | string;
}): Promise<number> {
  const accountId = String(options.accountId ?? CHATWOOT_ACCOUNT_ID);
  const existing = await findExistingConversation(
    accountId,
    options.contactId,
    options.inboxId,
  ).catch(() => null);
  if (existing) return existing;
  const res = await fetch(
    `${baseUrl()}/api/v1/accounts/${encodeURIComponent(accountId)}/conversations`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        source_id: String(options.contactId),
        contact_id: options.contactId,
        inbox_id: Number(options.inboxId),
        status: "open",
      }),
    },
  );
  const data = await res.json().catch(() => ({}) as any);
  if (!res.ok)
    throw new Error(`Chatwoot create conversation failed: ${res.status}`);
  const conversationId: number = data?.id ?? data?.payload?.id;
  if (!conversationId) throw new Error("Chatwoot conversationId not returned");
  return conversationId;
}

export async function createIncomingMessage(options: {
  accountId?: string | number;
  conversationId: number | string;
  content: string;
}): Promise<void> {
  const accountId = String(options.accountId ?? CHATWOOT_ACCOUNT_ID);
  const res = await fetch(
    `${baseUrl()}/api/v1/accounts/${encodeURIComponent(accountId)}/conversations/${encodeURIComponent(String(options.conversationId))}/messages`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        content: options.content,
        message_type: "incoming",
      }),
    },
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Chatwoot create message failed: ${res.status} ${txt}`);
  }
}

export async function createOutgoingMessage(options: {
  accountId?: string | number;
  conversationId: number | string;
  content: string;
}): Promise<void> {
  const accountId = String(options.accountId ?? CHATWOOT_ACCOUNT_ID);
  const res = await fetch(
    `${baseUrl()}/api/v1/accounts/${encodeURIComponent(accountId)}/conversations/${encodeURIComponent(String(options.conversationId))}/messages`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        content: options.content,
        message_type: "outgoing",
      }),
    },
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `Chatwoot create outgoing message failed: ${res.status} ${txt}`,
    );
  }
}
