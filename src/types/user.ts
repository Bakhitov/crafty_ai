import { z } from "zod";

export type UserPreferences = {
  displayName?: string;
  profession?: string; // User's job or profession
  responseStyleExample?: string; // Example of preferred response style
  botName?: string; // Name of the bot
  useAIGateway?: boolean; // Prefer routing via AI Gateway when available
  useOpenRouter?: boolean; // Prefer routing via OpenRouter when available
};

export type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  preferences?: UserPreferences;
};

export type UserRepository = {
  existsByEmail: (email: string) => Promise<boolean>;
  updateUser: (id: string, user: Pick<User, "name" | "image">) => Promise<User>;
  updatePreferences: (
    userId: string,
    preferences: UserPreferences,
  ) => Promise<User>;
  getPreferences: (userId: string) => Promise<UserPreferences | null>;
  findById: (userId: string) => Promise<User | null>;
};

export const UserZodSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const UserPreferencesZodSchema = z.object({
  displayName: z.string().optional(),
  profession: z.string().optional(),
  responseStyleExample: z.string().optional(),
  botName: z.string().optional(),
  useAIGateway: z.boolean().optional(),
  useOpenRouter: z.boolean().optional(),
});

// API keys stored in user.api_keys (jsonb)
export type ApiKeyEncrypted = {
  label?: string | null;
  cipher: string; // base64
  iv: string; // base64
  tag: string; // base64 (GCM auth tag)
  version: number; // crypto schema version
  isActive?: boolean; // default true
  createdAt?: string; // ISO
  lastUsedAt?: string | null; // ISO
  expiresAt?: string | null; // ISO
  scopes?: string[];
  baseUrl?: string | null; // optional custom endpoint per provider
};

export type ApiKeysJson = {
  [provider: string]: ApiKeyEncrypted[] | undefined;
};
