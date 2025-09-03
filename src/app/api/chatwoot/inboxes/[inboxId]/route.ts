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
  const res = await fetch(
    `${baseUrl()}/api/v1/accounts/${encodeURIComponent(String(CHATWOOT_ACCOUNT_ID))}/inboxes/${encodeURIComponent(inboxId)}`,
    { headers },
  );
  const data = await res.json().catch(() => ({}));
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ inboxId: string }> },
) {
  const { inboxId } = await params;
  const headers = {
    "Content-Type": "application/json",
    ...buildChatwootAuthHeaders(),
  } as HeadersInit;
  if (!CHATWOOT_ACCOUNT_ID || Object.keys(headers).length === 0)
    return new Response("Chatwoot env not configured", { status: 500 });
  const body = await req.json().catch(() => ({}));
  const res = await fetch(
    `${baseUrl()}/api/v1/accounts/${encodeURIComponent(String(CHATWOOT_ACCOUNT_ID))}/inboxes/${encodeURIComponent(inboxId)}`,
    { method: "PATCH", headers, body: JSON.stringify(body) },
  );
  const data = await res.json().catch(() => ({}));
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
