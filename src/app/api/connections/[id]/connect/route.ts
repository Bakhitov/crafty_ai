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

export async function POST(
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

  const evoRes = await fetch(
    `${EVO_API_URL}/instance/connect/${encodeURIComponent(conn.evolutionInstanceName)}`,
    { method: "GET", headers },
  );
  const data = await evoRes.json().catch(() => ({}));
  try {
    if (evoRes.ok && data?.qrcode) {
      await ConnectionRepository.updateStatusById(conn.id, "qr_required");
    }
  } catch {}
  return new Response(JSON.stringify(data), {
    status: evoRes.status,
    headers: { "Content-Type": "application/json" },
  });
}

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

  const evoRes = await fetch(
    `${EVO_API_URL}/instance/connect/${encodeURIComponent(conn.evolutionInstanceName)}`,
    { method: "GET", headers },
  );
  const data = await evoRes.json().catch(() => ({}));
  const qr = data?.qrcode;
  const pairing = qr?.pairingCode || qr?.code;
  const base64 = qr?.base64;

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"/><title>QR</title>
  <style>body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial;padding:24px;background:#0b0b0b;color:#e5e7eb} .wrap{max-width:640px;margin:0 auto} .qr{display:flex;align-items:center;justify-content:center;background:#111827;border:1px solid #374151;border-radius:12px;padding:16px} img{width:384px;height:384px;image-rendering:pixelated} textarea{width:100%;min-height:120px;background:#111827;color:#e5e7eb;border:1px solid #374151;border-radius:8px;padding:8px}</style>
  </head><body><div class="wrap"><h1>WhatsApp Web QR</h1>
  ${base64 ? `<div class="qr"><img src="${base64}" alt="qr"/></div>` : ""}
  ${!base64 && pairing ? `<h3>Pairing code</h3><textarea readonly>${pairing}</textarea>` : ""}
  ${!base64 && !pairing ? `<p>QR/Pairing code is not available yet. Try refreshing this page.</p>` : ""}
  </div></body></html>`;

  try {
    if (evoRes.ok && data?.qrcode) {
      await ConnectionRepository.updateStatusById(conn.id, "qr_required");
    }
  } catch {}

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
