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
    `${EVO_API_URL}/instance/restart/${encodeURIComponent(conn.evolutionInstanceName)}`,
    { method: "POST", headers },
  );
  const data = await evoRes.json().catch(() => ({}));
  try {
    if (evoRes.ok) {
      await ConnectionRepository.updateStatusById(conn.id, "connecting");
    }
  } catch {}
  return new Response(JSON.stringify(data), {
    status: evoRes.status,
    headers: { "Content-Type": "application/json" },
  });
}
