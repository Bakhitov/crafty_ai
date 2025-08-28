import { ApiKeysJson, ApiKeyEncrypted } from "app-types/user";
import { serverCache } from "lib/cache";
import { KeyCrypto } from "lib/security/key-crypto";
import { pgUserSecretRepository as userSecretRepo } from "lib/db/pg/repositories/user-secret-repository.pg";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const NEGATIVE_TTL_MS = 60 * 1000; // 60 seconds

function cacheKey(userId: string, provider: string) {
  return `user-key:${userId}:${provider}`;
}

export const UserKeyService = {
  async getKeyFor(userId: string, provider: string): Promise<string | null> {
    const keyName = cacheKey(userId, provider);
    const cached = await serverCache.get<string | null>(keyName);
    if (cached !== undefined) {
      return cached;
    }

    const apiKeys: ApiKeysJson | null = await userSecretRepo.getApiKeys(userId);
    const list: ApiKeyEncrypted[] | undefined = apiKeys?.[provider];
    const active = (list || []).find((k) => k.isActive !== false);

    if (!active) {
      await serverCache.set(keyName, null, NEGATIVE_TTL_MS);
      return null;
    }

    let plain: string;
    try {
      plain = KeyCrypto.decrypt({
        cipher: active.cipher,
        iv: active.iv,
        tag: active.tag,
        version: active.version,
      });
    } catch {
      await serverCache.set(keyName, null, NEGATIVE_TTL_MS);
      return null;
    }

    await serverCache.set(keyName, plain, CACHE_TTL_MS);
    return plain;
  },

  async getKeyWithMeta(
    userId: string,
    provider: string,
  ): Promise<{ apiKey: string; baseUrl?: string | null } | null> {
    const apiKeys: ApiKeysJson | null = await userSecretRepo.getApiKeys(userId);
    const list: ApiKeyEncrypted[] | undefined = apiKeys?.[provider];
    const active = (list || []).find((k) => k.isActive !== false);
    if (!active) return null;
    try {
      const apiKey = KeyCrypto.decrypt({
        cipher: active.cipher,
        iv: active.iv,
        tag: active.tag,
        version: active.version,
      });
      return { apiKey, baseUrl: active.baseUrl };
    } catch {
      return null;
    }
  },

  async setKey(
    userId: string,
    provider: string,
    plainKey: string,
    meta?: Pick<ApiKeyEncrypted, "label" | "scopes" | "expiresAt">,
  ): Promise<void> {
    const apiKeys = (await userSecretRepo.getApiKeys(userId)) || {};
    const encrypted = KeyCrypto.encrypt(plainKey);
    const nowIso = new Date().toISOString();
    const nextEntry: ApiKeyEncrypted = {
      ...encrypted,
      label: meta?.label ?? null,
      scopes: meta?.scopes,
      expiresAt: meta?.expiresAt ?? null,
      isActive: true,
      createdAt: nowIso,
      lastUsedAt: null,
    };
    const existing = apiKeys[provider] || [];
    // deactivate others or keep multiple — here keep multiple but mark active only the newest
    const updated = existing.map((k) => ({ ...k, isActive: false }));
    apiKeys[provider] = [nextEntry, ...updated];
    await userSecretRepo.setApiKeys(userId, apiKeys);
    await serverCache.delete(cacheKey(userId, provider));
  },

  async deactivate(
    userId: string,
    provider: string,
    label?: string | null,
  ): Promise<void> {
    const apiKeys = (await userSecretRepo.getApiKeys(userId)) || {};
    const list = apiKeys[provider] || [];
    apiKeys[provider] = list.map((k) => {
      if (!label) return { ...k, isActive: false };
      if ((k.label || null) === (label || null))
        return { ...k, isActive: false };
      return k;
    });
    await userSecretRepo.setApiKeys(userId, apiKeys);
    await serverCache.delete(cacheKey(userId, provider));
  },
};
