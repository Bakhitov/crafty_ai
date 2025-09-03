import { getSession } from "lib/auth/server";
import { ConnectionRepository } from "lib/db/pg/repositories/connection-repository.pg";
import { KeyCrypto } from "lib/security/key-crypto";
import { load } from "lib/load-env";
import { buildChatwootAuthHeaders } from "lib/services/chatwoot-auth";

const env = load();

const EVO_API_URL_RAW = process.env.EVO_API_URL || env.EVO_API_URL;
const EVO_API_URL =
  EVO_API_URL_RAW && /^https?:\/\//.test(EVO_API_URL_RAW)
    ? EVO_API_URL_RAW
    : EVO_API_URL_RAW
      ? `https://${EVO_API_URL_RAW}`
      : undefined;

const CHATWOOT_URL = (process.env.CHATWOOT_URL || (env as any).CHATWOOT_URL) as
  | string
  | undefined;
const CHATWOOT_ACCOUNT_ID = (process.env.CHATWOOT_ACCOUNT_ID ||
  (env as any).CHATWOOT_ACCOUNT_ID) as string | undefined;

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!EVO_API_URL) {
    return new Response("EVO_API_URL is not configured", { status: 500 });
  }

  const session = await getSession();
  const userId = session.user.id;
  const { id } = await params;

  const conn = await ConnectionRepository.findByIdAndUser(id, userId);
  if (!conn) return new Response("Not found", { status: 404 });
  // Попытаться удалить внешний ресурс провайдера (best-effort)
  if (conn.type === "whatsapp_evolution") {
    if (conn.evolutionInstanceName && conn.evolutionApikeyEncrypted) {
      const apikey = KeyCrypto.decrypt(conn.evolutionApikeyEncrypted);
      const headers = new Headers();
      headers.set("apikey", apikey);
      await fetch(
        `${EVO_API_URL}/instance/delete/${encodeURIComponent(conn.evolutionInstanceName)}`,
        { method: "DELETE", headers },
      ).catch(() => null);
    }
  } else if (
    conn.type === "chatwoot_channel" &&
    conn.chatwootInboxId &&
    CHATWOOT_URL &&
    CHATWOOT_ACCOUNT_ID
  ) {
    // Удалить Inbox в Chatwoot, если возможно (некоторые политики/версии могут не позволять)
    try {
      const headers = {
        "Content-Type": "application/json",
        ...buildChatwootAuthHeaders(),
      } as HeadersInit;
      if (Object.keys(headers).length > 0) {
        await fetch(
          `${CHATWOOT_URL.replace(/\/$/, "")}/api/v1/accounts/${encodeURIComponent(String(CHATWOOT_ACCOUNT_ID))}/inboxes/${encodeURIComponent(String(conn.chatwootInboxId))}`,
          { method: "DELETE", headers },
        ).catch(() => null);
      }
    } catch {}
  }

  await ConnectionRepository.deleteByIdAndUser(id, userId);
  return new Response(null, { status: 204 });
}
