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
const EVO_API_KEY = process.env.EVO_API_KEY || env.EVO_API_KEY;

export async function POST(request: Request) {
  if (!EVO_API_URL) {
    return new Response("EVO_API_URL is not configured", { status: 500 });
  }

  const session = await getSession();
  const userId = session.user.id;

  const body = await request.json().catch(() => ({}));
  const instanceName: string | undefined = body.instanceName;
  const displayName: string | undefined = body.displayName;
  if (!instanceName) {
    return new Response(
      JSON.stringify({ error: true, message: "instanceName is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Create Evolution instance
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (EVO_API_KEY) headers.set("apikey", EVO_API_KEY);

  const evoRes = await fetch(`${EVO_API_URL}/instance/create`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      instanceName,
      integration: body.integration || "WHATSAPP-BAILEYS",
      qrcode: body.qrcode !== false,
    }),
  });

  const evoData = await evoRes.json().catch(() => ({}));
  if (!evoRes.ok) {
    return new Response(
      JSON.stringify({ error: true, status: evoRes.status, data: evoData }),
      {
        status: evoRes.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const hash: string | undefined = evoData.hash;
  const encrypted = hash ? KeyCrypto.encrypt(hash) : null;

  const conn = await ConnectionRepository.create({
    userId,
    type: "whatsapp_evolution",
    displayName: displayName ?? instanceName,
    status: (evoData.instance?.status as any) || "connecting",
    evolutionInstanceName: instanceName,
    evolutionApikeyEncrypted: encrypted,
    providerMetadata: {},
  });

  // If QR is present immediately, mark as qr_required for clearer UX
  try {
    if (evoData?.qrcode) {
      await ConnectionRepository.updateStatusById(conn.id, "qr_required");
    }
  } catch {}

  // Configure Evolution webhook to notify Better-Chatbot about status updates
  try {
    if (hash) {
      const webhookHeaders = new Headers();
      webhookHeaders.set("Content-Type", "application/json");
      webhookHeaders.set("apikey", hash);
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || env.NEXT_PUBLIC_BASE_URL;
      if (baseUrl) {
        const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/webhooks/evolution/${conn.id}`;
        await fetch(
          `${EVO_API_URL}/webhook/set/${encodeURIComponent(instanceName)}`,
          {
            method: "POST",
            headers: webhookHeaders,
            body: JSON.stringify({
              webhook: {
                enabled: true,
                url: webhookUrl,
                byEvents: false,
                base64: true,
              },
            }),
          },
        ).catch(() => null);
      }
    }
  } catch {}

  // Optional: auto-create Chatwoot integration via Evolution if chatwoot block provided
  try {
    // Prefer body.chatwoot; if absent, try env-driven auto config
    const envChatwootUrl =
      process.env.CHATWOOT_URL || (env as any).CHATWOOT_URL;
    const envChatwootAccountId =
      process.env.CHATWOOT_ACCOUNT_ID || (env as any).CHATWOOT_ACCOUNT_ID;
    const envChatwootToken =
      process.env.CHATWOOT_TOKEN || (env as any).CHATWOOT_TOKEN;
    const envChatwootSignMsg =
      process.env.CHATWOOT_SIGN_MSG || (env as any).CHATWOOT_SIGN_MSG; // 'true' | 'false'
    const envChatwootInboxName =
      process.env.CHATWOOT_INBOX_NAME || (env as any).CHATWOOT_INBOX_NAME;
    const envChatwootReopen =
      process.env.CHATWOOT_REOPEN_CONVERSATION ||
      (env as any).CHATWOOT_REOPEN_CONVERSATION;
    const envChatwootPending =
      process.env.CHATWOOT_CONVERSATION_PENDING ||
      (env as any).CHATWOOT_CONVERSATION_PENDING;
    const envChatwootOrganization =
      process.env.CHATWOOT_ORGANIZATION || (env as any).CHATWOOT_ORGANIZATION;
    const envChatwootLogo =
      process.env.CHATWOOT_LOGO || (env as any).CHATWOOT_LOGO;
    const envChatwootIgnoreJids =
      process.env.CHATWOOT_IGNORE_JIDS || (env as any).CHATWOOT_IGNORE_JIDS; // comma-separated

    const chatwoot: any =
      body.chatwoot ||
      (envChatwootUrl && envChatwootAccountId && envChatwootToken
        ? {
            url: envChatwootUrl,
            accountId: envChatwootAccountId,
            token: envChatwootToken,
            signMsg:
              String(envChatwootSignMsg ?? "true").toLowerCase() !== "false",
            nameInbox: envChatwootInboxName || undefined,
            reopenConversation:
              String(envChatwootReopen ?? "true").toLowerCase() !== "false",
            conversationPending:
              String(envChatwootPending ?? "false").toLowerCase() === "true",
            organization: envChatwootOrganization || undefined,
            logo: envChatwootLogo || undefined,
            ignoreJids: envChatwootIgnoreJids
              ? String(envChatwootIgnoreJids)
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : undefined,
          }
        : null);
    if (
      hash &&
      chatwoot &&
      chatwoot.url &&
      chatwoot.accountId &&
      chatwoot.token
    ) {
      const cwHeaders = new Headers();
      cwHeaders.set("Content-Type", "application/json");
      cwHeaders.set("apikey", hash);
      const urlServer =
        process.env.NEXT_PUBLIC_BASE_URL || env.NEXT_PUBLIC_BASE_URL;
      // Inbox name must strictly equal instanceName
      const inboxName = instanceName;
      const payload = {
        enabled: true,
        url: chatwoot.url,
        accountId: String(chatwoot.accountId),
        token: chatwoot.token,
        nameInbox: inboxName,
        signMsg: chatwoot.signMsg === false ? false : true,
        signDelimiter: chatwoot.signDelimiter ?? undefined,
        reopenConversation: chatwoot.reopenConversation ?? true,
        conversationPending: chatwoot.conversationPending ?? false,
        mergeBrazilContacts: chatwoot.mergeBrazilContacts ?? false,
        importContacts: chatwoot.importContacts ?? false,
        importMessages: chatwoot.importMessages ?? false,
        daysLimitImportMessages: chatwoot.daysLimitImportMessages ?? undefined,
        organization: chatwoot.organization ?? undefined,
        logo: chatwoot.logo ?? undefined,
        ignoreJids: Array.isArray(chatwoot.ignoreJids)
          ? chatwoot.ignoreJids
          : undefined,
        autoCreate: true,
        number: chatwoot.number ?? undefined,
      };

      const res = await fetch(
        `${EVO_API_URL}/chatbot/chatwoot/set/${encodeURIComponent(instanceName)}`,
        {
          method: "POST",
          headers: cwHeaders,
          body: JSON.stringify(payload),
        },
      );

      // Best-effort: try to read back what Evolution persisted (inboxes list) and store ids
      if (res.ok) {
        try {
          const cwFindRes = await fetch(
            `${EVO_API_URL}/chatbot/chatwoot/find/${encodeURIComponent(instanceName)}`,
            {
              method: "GET",
              headers: cwHeaders,
            },
          );
          const cwData = await cwFindRes.json().catch(() => ({}) as any);
          // Сохраним базовую связку в нашей БД
          await ConnectionRepository.updateChatwootLinkById(conn.id, {
            chatwootAccountId: String(chatwoot.accountId),
            chatwootInboxId: cwData?.inboxId ? String(cwData.inboxId) : null,
            chatwootWebhookUrl: urlServer
              ? `${urlServer.replace(/\/$/, "")}/api/webhooks/chatwoot/${conn.id}`
              : null,
          });
        } catch {}
      }
    }
  } catch {}

  const result = {
    id: conn.id,
    instance: evoData.instance,
    qrcode: evoData.qrcode,
  };
  return new Response(JSON.stringify(result), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
