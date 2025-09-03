import { ConnectionRepository } from "lib/db/pg/repositories/connection-repository.pg";
import {
  ensureContact,
  ensureConversation,
  createIncomingMessage,
} from "lib/services/chatwoot-bridge";

// Minimal webhook to track connection status updates from Evolution
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as any;

  // Expect something like { event: 'connection.update' | 'remove.instance' | 'logout.instance' | 'qrcode.updated', state: 'open' | 'close' | 'connecting' | 'qr' }
  const state: string | undefined =
    body?.state || body?.instance?.state || body?.status;
  if (state) {
    const map: Record<
      string,
      "qr_required" | "connecting" | "open" | "close" | "error"
    > = {
      qr: "qr_required",
      connecting: "connecting",
      open: "open",
      close: "close",
      closed: "close",
      error: "error",
    };
    const target = map[state.toLowerCase?.() || state] || "connecting";
    await ConnectionRepository.updateStatusById(id, target);
  }

  // If Evolution sends explicit QR code update event
  if (body?.qrcode || body?.event === "QRCODE_UPDATED") {
    await ConnectionRepository.updateStatusById(id, "qr_required");
  }

  // Handle event-driven status when state is not present
  try {
    const ev: string | undefined = body?.event || body?.type;
    if (ev) {
      const evLower = ev.toLowerCase();
      if (
        evLower.includes("remove.instance") ||
        evLower.includes("logout.instance") ||
        evLower.includes("no.connection")
      ) {
        await ConnectionRepository.updateStatusById(id, "close");
      } else if (evLower.includes("connection.update")) {
        // Try to infer from body.connectionStatus
        const s: string | undefined =
          body?.connectionStatus || body?.instance?.connectionStatus;
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
        };
        const target = s ? map[s.toLowerCase?.() || s] || undefined : undefined;
        if (target) await ConnectionRepository.updateStatusById(id, target);
      }
    }
  } catch {}

  // Try to enrich metadata and display name on successful open or when profile info present
  try {
    const profileName: string | undefined =
      body?.instance?.profileName || body?.profileName || body?.pushName;
    const wid: string | undefined =
      body?.instance?.wid || body?.wid || body?.instance?.wuid;
    // Prefer explicit number/ownerJid; fallback to wid/wuid/phone
    const ownerJid: string | undefined =
      body?.instance?.ownerJid || body?.ownerJid;
    const phone =
      body?.instance?.number ||
      body?.number ||
      (ownerJid ? ownerJid.split?.("@")[0] : undefined) ||
      body?.instance?.phone ||
      body?.phone ||
      (wid?.split?.("@")[0] ?? undefined);
    const patch: Record<string, unknown> = {};
    if (phone) patch.phone = phone;
    if (Object.keys(patch).length)
      await ConnectionRepository.mergeProviderMetadata(id, patch);
    if (profileName)
      await ConnectionRepository.updateDisplayName(id, profileName);
  } catch {}

  // Bridge incoming messages to Chatwoot (best-effort)
  try {
    const event = String(body?.event || body?.type || "").toLowerCase();
    const messageText: string | undefined =
      body?.message?.text ||
      body?.message?.conversation ||
      body?.text ||
      body?.content;
    const phone =
      body?.instance?.number ||
      body?.number ||
      body?.instance?.phone ||
      body?.phone ||
      body?.from ||
      body?.remoteJid?.split?.("@")[0] ||
      undefined;

    if ((event.includes("message") || body?.message) && messageText && phone) {
      // fetch connection row
      const latest = await ConnectionRepository.findById(id).catch(() => null);
      const chatwootInboxId = (latest as any)?.chatwootInboxId;
      if (chatwootInboxId) {
        const contact = await ensureContact({
          inboxId: chatwootInboxId,
          phone,
          name: body?.pushName || body?.profileName || undefined,
        }).catch(() => null);
        if (contact?.contactId) {
          const convId = await ensureConversation({
            contactId: contact.contactId,
            inboxId: chatwootInboxId,
          }).catch(() => null);
          if (convId) {
            await createIncomingMessage({
              conversationId: convId,
              content: messageText,
            }).catch(() => null);
          }
        }
      }
    }
  } catch {}

  return new Response("OK", { status: 200 });
}
