import { load } from "lib/load-env";

const env = load();

const EVO_API_URL_RAW = process.env.EVO_API_URL || env.EVO_API_URL;
const EVO_API_URL =
  EVO_API_URL_RAW && /^https?:\/\//.test(EVO_API_URL_RAW)
    ? EVO_API_URL_RAW
    : EVO_API_URL_RAW
      ? `https://${EVO_API_URL_RAW}`
      : undefined;
const EVO_API_KEY = process.env.EVO_API_KEY || env.EVO_API_KEY;

export async function POST(request: Request) {
  if (!EVO_API_URL) {
    return new Response("EVO_API_URL is not configured", { status: 500 });
  }

  try {
    const body = await request.json();
    const headers = new Headers();
    headers.set("Content-Type", "application/json");

    // Allow client to override API key for specific tenants if needed
    const overrideKey = request.headers.get("x-evo-apikey") || body?.apikey;
    const apiKeyToUse = overrideKey || EVO_API_KEY;
    if (apiKeyToUse) headers.set("apikey", apiKeyToUse);

    const res = await fetch(`${EVO_API_URL}/instance/create`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        instanceName: body.instanceName,
        integration: body.integration || "WHATSAPP-BAILEYS",
        qrcode: body.qrcode !== false,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: true, status: res.status, data }),
        {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: true, message: (error as Error).message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
