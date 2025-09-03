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
  request: Request,
  { params }: { params: Promise<{ instanceName: string }> },
) {
  if (!EVO_API_URL) {
    return new Response("EVO_API_URL is not configured", { status: 500 });
  }

  const { instanceName } = await params;
  const url = new URL(request.url);
  const queryApiKey = url.searchParams.get("apikey");
  const headerApiKey =
    request.headers.get("x-evo-apikey") ||
    request.headers.get("apikey") ||
    undefined;
  const apikey = headerApiKey || queryApiKey;

  const headers = new Headers();
  if (apikey) headers.set("apikey", apikey);

  const res = await fetch(
    `${EVO_API_URL}/instance/connectionState/${encodeURIComponent(instanceName)}`,
    {
      method: "GET",
      headers,
    },
  );

  const data = await res.json().catch(() => ({}));
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
