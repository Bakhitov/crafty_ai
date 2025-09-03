import { load } from "lib/load-env";

const env = load();

export function buildChatwootAuthHeaders(): HeadersInit {
  const bearer = process.env.CHATWOOT_TOKEN || (env as any).CHATWOOT_TOKEN;
  const access =
    process.env.CHATWOOT_ACCESS_TOKEN || (env as any).CHATWOOT_ACCESS_TOKEN;
  const client = process.env.CHATWOOT_CLIENT || (env as any).CHATWOOT_CLIENT;
  const uid = process.env.CHATWOOT_UID || (env as any).CHATWOOT_UID;

  if (bearer) {
    return { Authorization: `Bearer ${bearer}` } as HeadersInit;
  }

  if (access && client && uid) {
    return {
      "access-token": String(access),
      client: String(client),
      uid: String(uid),
    } as HeadersInit;
  }

  return {};
}
