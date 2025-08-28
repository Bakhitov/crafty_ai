import "server-only";

import { createOllama } from "ollama-ai-provider-v2";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { xai, createXai } from "@ai-sdk/xai";
import { openrouter, createOpenRouter } from "@openrouter/ai-sdk-provider";
import { LanguageModel } from "ai";
import {
  createOpenAICompatibleModels,
  openaiCompatibleModelsSafeParse,
} from "./create-openai-compatiable";
import { ChatModel } from "app-types/chat";
import { UserKeyService } from "lib/services/user-key.service";

const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
});

const staticModels = {
  openai: {
    "gpt-4.1": openai("gpt-4.1"),
    "gpt-4.1-mini": openai("gpt-4.1-mini"),
    "o4-mini": openai("o4-mini"),
    o3: openai("o3"),
    "gpt-5": openai("gpt-5"),
    "gpt-5-mini": openai("gpt-5-mini"),
    "gpt-5-nano": openai("gpt-5-nano"),
  },
  google: {
    "gemini-2.5-flash-lite": google("gemini-2.5-flash-lite"),
    "gemini-2.5-flash": google("gemini-2.5-flash"),
    "gemini-2.5-pro": google("gemini-2.5-pro"),
    "gemini-2.5-flash-image-preview": google("gemini-2.5-flash-image-preview"),
  },
  anthropic: {
    "claude-4-sonnet": anthropic("claude-4-sonnet-20250514"),
    "claude-4-opus": anthropic("claude-4-opus-20250514"),
    "claude-3-7-sonnet": anthropic("claude-3-7-sonnet-20250219"),
  },
  xai: {
    "grok-4": xai("grok-4"),
    "grok-3": xai("grok-3"),
    "grok-3-mini": xai("grok-3-mini"),
  },
  ollama: {
    "gemma3:1b": ollama("gemma3:1b"),
    "gemma3:4b": ollama("gemma3:4b"),
    "gemma3:12b": ollama("gemma3:12b"),
  },
  openRouter: {
    "gpt-oss-20b:free": openrouter("openai/gpt-oss-20b:free"),
    "qwen3-8b:free": openrouter("qwen/qwen3-8b:free"),
    "qwen3-14b:free": openrouter("qwen/qwen3-14b:free"),
    "qwen3-coder:free": openrouter("qwen/qwen3-coder:free"),
    "deepseek-r1:free": openrouter("deepseek/deepseek-r1-0528:free"),
    "deepseek-v3:free": openrouter("deepseek/deepseek-chat-v3-0324:free"),
    "gemini-2.0-flash-exp:free": openrouter("google/gemini-2.0-flash-exp:free"),
  },
};

const staticUnsupportedModels = new Set([
  staticModels.openai["o4-mini"],
  staticModels.ollama["gemma3:1b"],
  staticModels.ollama["gemma3:4b"],
  staticModels.ollama["gemma3:12b"],
  staticModels.openRouter["gpt-oss-20b:free"],
  staticModels.openRouter["qwen3-8b:free"],
  staticModels.openRouter["qwen3-14b:free"],
  staticModels.openRouter["deepseek-r1:free"],
  staticModels.openRouter["gemini-2.0-flash-exp:free"],
]);

const openaiCompatibleProviders = openaiCompatibleModelsSafeParse(
  process.env.OPENAI_COMPATIBLE_DATA,
);

const {
  providers: openaiCompatibleModels,
  unsupportedModels: openaiCompatibleUnsupportedModels,
} = createOpenAICompatibleModels(openaiCompatibleProviders);

const allModels = { ...openaiCompatibleModels, ...staticModels };

const allUnsupportedModels = new Set([
  ...openaiCompatibleUnsupportedModels,
  ...staticUnsupportedModels,
]);

export const isToolCallUnsupportedModel = (model: LanguageModel) => {
  return allUnsupportedModels.has(model);
};

const fallbackModel = staticModels.openai["gpt-4.1"];

// Image-only models that are not LanguageModel (used for generateImage())
// We expose them in the model list for discoverability and mark them with supportsImage,
// but they are not returned by getModel (chat uses LanguageModel only).
const imageOnlyModelsByProvider: Record<string, string[]> = {
  openai: ["gpt-image-1", "dall-e-3", "dall-e-2"],
  google: ["imagen-3.0-generate-002"],
  xai: ["grok-2-image"],
};

export const customModelProvider = {
  modelsInfo: (() => {
    const base = Object.entries(allModels).map(([provider, models]) => ({
      provider,
      models: Object.entries(models).map(([name, model]) => ({
        name,
        isToolCallUnsupported: isToolCallUnsupportedModel(model),
        supportsImage:
          provider === "google" && name === "gemini-2.5-flash-image-preview",
      })),
    }));

    const merged = new Map<string, { provider: string; models: any[] }>();
    base.forEach((entry) => merged.set(entry.provider, { ...entry }));

    Object.entries(imageOnlyModelsByProvider).forEach(([provider, names]) => {
      const items = names.map((name) => ({
        name,
        isToolCallUnsupported: true,
        supportsImage: true,
      }));
      if (merged.has(provider)) {
        merged.get(provider)!.models.push(...items);
      } else {
        merged.set(provider, { provider, models: items });
      }
    });

    return Array.from(merged.values());
  })(),
  getModel: (model?: ChatModel): LanguageModel => {
    if (!model) return fallbackModel;
    return allModels[model.provider]?.[model.model] || fallbackModel;
  },
  /**
   * Returns LanguageModel configured with per-user API key if available.
   * Falls back to env-configured static model when user key is missing.
   */
  getModelForUser: async (
    userId: string,
    model?: ChatModel,
  ): Promise<LanguageModel> => {
    if (!model) return fallbackModel;
    const provider = model.provider;
    const modelName = model.model;

    // Try to load user's API key by provider
    const providerKeyMap: Record<string, string> = {
      openai: "openai",
      google: "google",
      anthropic: "anthropic",
      xai: "xai",
      openRouter: "openrouter",
    };

    const providerKey = providerKeyMap[provider];
    if (!providerKey) return allModels[provider]?.[modelName] || fallbackModel;

    const keyMeta = await UserKeyService.getKeyWithMeta(userId, providerKey);

    try {
      if (keyMeta?.apiKey) {
        const common = { apiKey: keyMeta.apiKey } as const;
        if (provider === "openai")
          return createOpenAI({
            ...common,
            baseURL: keyMeta.baseUrl || undefined,
          })(modelName);
        if (provider === "google")
          return createGoogleGenerativeAI({
            ...common,
            baseURL: keyMeta.baseUrl || undefined,
          })(modelName);
        if (provider === "anthropic")
          return createAnthropic({
            ...common,
            baseURL: keyMeta.baseUrl || undefined,
          })(modelName);
        if (provider === "xai")
          return createXai({
            ...common,
            baseURL: keyMeta.baseUrl || undefined,
          })(modelName);
        if (provider === "openRouter")
          return createOpenRouter({
            ...common,
            baseURL: keyMeta.baseUrl || undefined,
          })(modelName);
      }
    } catch {
      // ignore and decide below
    }

    // Strict mode: no fallback to env for API-key providers
    throw new Error(
      `User API key for provider '${provider}' is not configured`,
    );
  },
};
