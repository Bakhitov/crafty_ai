import { getSession } from "lib/auth/server";
import { ConnectionRepository } from "lib/db/pg/repositories/connection-repository.pg";
import { KeyCrypto } from "lib/security/key-crypto";
import { load } from "lib/load-env";

const env = load();

const EVO_API_URL_RAW = process.env.EVO_API_URL || env.EVO_API_URL;
const EVO_API_URL =
  EVO_API_URL_RAW && /^https?:\/\//.test(EVO_API_URL_RAW)
    ? EVO_API_URL_RAW
    : EVO_API_URL_RAW
      ? `https://${EVO_API_URL_RAW}`
      : undefined;

export async function GET(
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
  if (!conn) {
    return new Response("Not found", { status: 404 });
  }
  if (
    conn.type !== "whatsapp_evolution" ||
    !conn.evolutionInstanceName ||
    !conn.evolutionApikeyEncrypted
  ) {
    return new Response("Invalid connection", { status: 400 });
  }

  const apikey = KeyCrypto.decrypt(conn.evolutionApikeyEncrypted);
  const headers = new Headers();
  headers.set("apikey", apikey);

  const evoRes = await fetch(
    `${EVO_API_URL}/instance/connectionState/${encodeURIComponent(conn.evolutionInstanceName)}`,
    {
      method: "GET",
      headers,
    },
  );
  const data = await evoRes.json().catch(() => ({}));
  // Try to sync status with DB based on response
  try {
    // Evolution returns { instance: { state }} here; but be defensive
    const rawState: string | undefined =
      data?.instance?.state ||
      data?.instance?.connectionStatus ||
      data?.connectionStatus ||
      data?.state ||
      data?.status;
    if (rawState) {
      const normalized = String(rawState).toLowerCase();
      const map: Record<
        string,
        "qr_required" | "connecting" | "open" | "close" | "error"
      > = {
        qr: "qr_required",
        qrcode: "qr_required",
        qrcode_required: "qr_required",
        connecting: "connecting",
        open: "open",
        close: "close",
        closed: "close",
        error: "error",
        created: "connecting",
      };
      const target =
        map[normalized] ||
        (normalized.includes("qr") ? "qr_required" : (normalized as any));
      if (target) {
        await ConnectionRepository.updateStatusById(id, target);
      }
    }
  } catch {}
  // Optional: fetch extra stats if available (best-effort)
  try {
    const extra: any = {};
    // Attempt to infer phone from response if present
    if (data?.instance?.phone) extra.phone = data.instance.phone;
    if (data?.instance?.wid?.split?.("@")[0])
      extra.phone = data.instance.wid.split("@")[0];
    // Placeholder for stats; if you expose endpoints in Evolution, fetch and fill here
    // extra.stats = { chats: n, contacts: n, messages: n };
    if (Object.keys(extra).length) {
      await ConnectionRepository.mergeProviderMetadata(id, extra);
    }
  } catch {}
  return new Response(JSON.stringify(data), {
    status: evoRes.status,
    headers: { "Content-Type": "application/json" },
  });
}
