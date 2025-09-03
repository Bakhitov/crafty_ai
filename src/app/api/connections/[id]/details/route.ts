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
  if (!conn) return new Response("Not found", { status: 404 });
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

  const url = new URL(`${EVO_API_URL}/instance/fetchInstances`);
  url.searchParams.set("instanceName", conn.evolutionInstanceName);

  const evoRes = await fetch(url.toString(), { method: "GET", headers });
  const data = await evoRes.json().catch(() => ({}));

  // Best-effort: persist phone, displayName and stats into our DB for quicker UI
  try {
    const list = Array.isArray(data) ? data : [data];
    const info = list[0] || {};
    const phone: string | undefined =
      info?.number ||
      (info?.ownerJid ? info.ownerJid.split?.("@")[0] : undefined) ||
      info?.wid?.split?.("@")[0] ||
      info?.wuid;
    const profileName: string | undefined = info?.profileName;
    const nameFallback: string | undefined = info?.name;
    const counts: any = info?._count || {};
    const statsPatch: Record<string, unknown> = {};
    if (
      typeof counts?.Message === "number" ||
      typeof counts?.Contact === "number" ||
      typeof counts?.Chat === "number"
    ) {
      statsPatch.stats = {
        messages:
          typeof counts?.Message === "number" ? counts.Message : undefined,
        contacts:
          typeof counts?.Contact === "number" ? counts.Contact : undefined,
        chats: typeof counts?.Chat === "number" ? counts.Chat : undefined,
      };
    }
    const metaPatch: Record<string, unknown> = {};
    if (phone) metaPatch.phone = phone;
    await ConnectionRepository.mergeProviderMetadata(id, {
      ...metaPatch,
      ...statsPatch,
    });
    const display = profileName || nameFallback || undefined;
    if (display) await ConnectionRepository.updateDisplayName(id, display);

    // Sync status from fetchInstances.connectionStatus if present
    const raw = (info?.connectionStatus ||
      info?.instance?.connectionStatus ||
      info?.state ||
      info?.status) as string | undefined;
    if (raw) {
      const normalized = String(raw).toLowerCase();
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
        (normalized.includes("qr") ? "qr_required" : undefined);
      if (target) {
        await ConnectionRepository.updateStatusById(id, target);
      }
    }
  } catch {}
  return new Response(JSON.stringify(data), {
    status: evoRes.status,
    headers: { "Content-Type": "application/json" },
  });
}
