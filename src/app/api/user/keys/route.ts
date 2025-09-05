import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { z } from "zod";
import { pgUserSecretRepository as userSecretRepo } from "lib/db/pg/repositories/user-secret-repository.pg";
import { KeyCrypto } from "lib/security/key-crypto";
import { ApiKeyEncrypted } from "app-types/user";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const apiKeys = await userSecretRepo.getApiKeys(session.user.id);
  // hide sensitive fields; return only metadata; omit empty providers
  const meta: Record<string, any[]> = {};
  for (const [provider, list] of Object.entries(apiKeys || {})) {
    const items = (list || []).map((k) => ({
      label: k.label || null,
      isActive: k.isActive !== false,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt || null,
      expiresAt: k.expiresAt || null,
      scopes: k.scopes || [],
      baseUrl: k.baseUrl || null,
    }));
    if (items.length > 0) meta[provider] = items;
  }
  return NextResponse.json(meta);
}

const setKeyBody = z.object({
  provider: z.string().min(1),
  key: z.string().min(1),
  label: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
  baseUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const parsed = setKeyBody.parse(body);
  const { provider, key, label, scopes, expiresAt, baseUrl } = parsed;
  const keyTrimmed = key.trim();
  const baseUrlTrimmed = baseUrl?.trim();

  const enc = KeyCrypto.encrypt(keyTrimmed);
  const apiKeys = (await userSecretRepo.getApiKeys(session.user.id)) || {};
  const nowIso = new Date().toISOString();
  const entry: ApiKeyEncrypted = {
    ...enc,
    label: label ?? null,
    scopes,
    expiresAt: expiresAt ?? null,
    baseUrl: baseUrlTrimmed ?? null,
    isActive: true,
    createdAt: nowIso,
    lastUsedAt: null,
  };
  const existing = apiKeys[provider] || [];
  const updated = existing.map((k) => ({ ...k, isActive: false }));
  apiKeys[provider] = [entry, ...updated];
  await userSecretRepo.setApiKeys(session.user.id, apiKeys);
  return NextResponse.json({ success: true });
}

const patchBody = z.object({
  provider: z.string().min(1),
  label: z.string().nullable().optional(),
  action: z.enum(["deactivate"]).default("deactivate"),
});

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { provider, label } = patchBody.parse(body);
  const apiKeys = (await userSecretRepo.getApiKeys(session.user.id)) || {};
  const list = apiKeys[provider] || [];
  apiKeys[provider] = list.map((k) => {
    if (label === undefined) return { ...k, isActive: false };
    if ((k.label || null) === (label || null)) return { ...k, isActive: false };
    return k;
  });
  await userSecretRepo.setApiKeys(session.user.id, apiKeys);
  return NextResponse.json({ success: true });
}

const deleteBody = z.object({
  provider: z.string().min(1),
  label: z.string().nullable().optional(),
});

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { provider, label } = deleteBody.parse(body);
  const apiKeys = (await userSecretRepo.getApiKeys(session.user.id)) || {};
  const current = apiKeys[provider] || [];
  if (label === undefined) {
    // delete all keys for provider
    apiKeys[provider] = [];
  } else {
    apiKeys[provider] = current.filter(
      (k) => (k.label || null) !== (label || null),
    );
  }
  await userSecretRepo.setApiKeys(session.user.id, apiKeys);
  return NextResponse.json({ success: true });
}
