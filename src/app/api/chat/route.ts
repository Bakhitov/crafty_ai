import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
  UIMessage,
  experimental_generateImage,
} from "ai";

import {
  customModelProvider,
  isToolCallUnsupportedModel,
  isImageOnlyModel,
  isImageCapableModel,
} from "lib/ai/models";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createFal } from "@ai-sdk/fal";
import { createLuma } from "@ai-sdk/luma";
import { createReplicate } from "@ai-sdk/replicate";

import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";

import { agentRepository, chatRepository } from "lib/db/repository";
import globalLogger from "logger";
import {
  buildMcpServerCustomizationsSystemPrompt,
  buildUserSystemPrompt,
  buildToolCallUnsupportedModelSystemPrompt,
} from "lib/ai/prompts";
import {
  chatApiSchemaRequestBodySchema,
  ChatMetadata,
  ChatMention,
} from "app-types/chat";

import { errorIf, safe } from "ts-safe";

import {
  excludeToolExecution,
  handleError,
  manualToolExecuteByLastMessage,
  mergeSystemPrompt,
  extractInProgressToolPart,
  filterMcpServerCustomizations,
  loadMcpTools,
  loadWorkFlowTools,
  loadAppDefaultTools,
  convertToSavePart,
} from "./shared.chat";
import {
  rememberAgentAction,
  rememberMcpServerCustomizationsAction,
} from "./actions";
import { getSession } from "auth/server";
import { colorize } from "consola/utils";
import { generateUUID } from "lib/utils";
import { UserKeyService } from "lib/services/user-key.service";
import { setExaApiKey, clearExaApiKey } from "lib/ai/tools/web/web-search";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Chat API: `),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();

    const session = await getSession();

    if (!session?.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }
    const {
      id,
      message,
      chatModel,
      toolChoice,
      allowedAppDefaultToolkit,
      allowedMcpServers,
      mentions = [],
      imageSettings,
    } = chatApiSchemaRequestBodySchema.parse(json);

    const model = await customModelProvider.getModelForUser(
      session.user.id,
      chatModel,
    );

    let thread = await chatRepository.selectThreadDetails(id);

    if (!thread) {
      logger.info(`create chat thread: ${id}`);
      const newThread = await chatRepository.insertThread({
        id,
        title: "",
        userId: session.user.id,
      });
      thread = await chatRepository.selectThreadDetails(newThread.id);
    }

    if (thread!.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    const messages: UIMessage[] = (thread?.messages ?? []).map((m) => {
      return {
        id: m.id,
        role: m.role,
        parts: m.parts,
        metadata: m.metadata,
      };
    });

    if (messages.at(-1)?.id == message.id) {
      messages.pop();
    }
    messages.push(message);

    const supportToolCall = !isToolCallUnsupportedModel(model);

    const agentMention = mentions.find(
      (m): m is Extract<ChatMention, { type: "agent" }> => m.type === "agent",
    );
    const agentId = agentMention?.agentId;

    const agent = await rememberAgentAction(agentId, session.user.id);

    if (agent?.instructions?.mentions) {
      mentions.push(...agent.instructions.mentions);
    }

    const isToolCallAllowed =
      supportToolCall && (toolChoice != "none" || mentions.length > 0);

    const metadata: ChatMetadata = {
      agentId: agent?.id,
      toolChoice: toolChoice,
      toolCount: 0,
      chatModel: chatModel,
    };

    let generatedImageMessage: UIMessage | null = null;

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        const mcpClients = await mcpClientsManager.getClients();
        const mcpTools = await mcpClientsManager.tools();
        logger.info(
          `mcp-server count: ${mcpClients.length}, mcp-tools count :${Object.keys(mcpTools).length}`,
        );
        const MCP_TOOLS = await safe()
          .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
          .map(() =>
            loadMcpTools({
              mentions,
              allowedMcpServers,
            }),
          )
          .orElse({});

        const WORKFLOW_TOOLS = await safe()
          .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
          .map(() =>
            loadWorkFlowTools({
              mentions,
              dataStream,
              userId: session.user.id,
            }),
          )
          .orElse({});

        const APP_DEFAULT_TOOLS = await safe()
          .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
          .map(() =>
            loadAppDefaultTools({
              mentions,
              allowedAppDefaultToolkit,
            }),
          )
          .orElse({});
        // Inject user-scoped EXA key for app default web-search tools (before any tool execution)
        const exaKey =
          (await UserKeyService.getKeyFor(session.user.id, "exa")) ||
          process.env.EXA_API_KEY ||
          null;
        setExaApiKey(exaKey);

        // Basic attachment preprocessing: if markitdown MCP is available,
        // send file attachments to markitdown and replace them with markdown text.
        try {
          // Find a markitdown tool if available in current MCP tools
          const markitdownEntry = Object.entries(MCP_TOOLS || {}).find(
            ([key, tool]: [string, any]) =>
              (tool?._mcpServerName || "")
                .toString()
                .toLowerCase()
                .includes("markitdown") ||
              key.toLowerCase().includes("markitdown"),
          );

          // Extract file parts from the latest user message
          const fileParts = (message?.parts || []).filter(
            (p: any) => p && p.type === "file",
          );

          if (markitdownEntry && fileParts.length > 0) {
            const [, tool]: [string, any] = markitdownEntry;
            const serverName: string = tool._mcpServerName;
            const originToolName: string = tool._originToolName;

            // Prefer http(s) URLs if present; otherwise fallback to data URIs/base64
            const urls = fileParts
              .map((p: any) => p?.url as string | undefined)
              .filter(
                (u: string | undefined): u is string =>
                  !!u && /^https?:\/\//i.test(u),
              );

            const dataFiles = fileParts
              .map((p: any) => {
                const filename = (p?.filename as string) || "attachment";
                const mediaType =
                  (p?.mediaType as string) || "application/octet-stream";
                const url: string | undefined = p?.url;
                const base64: string | undefined = (p as any)?.base64;

                if (typeof url === "string" && url.startsWith("data:")) {
                  const commaIndex = url.indexOf(",");
                  const meta = url.slice(0, Math.max(0, commaIndex));
                  const data = commaIndex >= 0 ? url.slice(commaIndex + 1) : "";
                  const m = /data:(.*?);base64/i.exec(meta || "");
                  const mime = (m && m[1]) || mediaType;
                  return { filename, mimeType: mime, data };
                }
                if (typeof base64 === "string" && base64.length > 0) {
                  return { filename, mimeType: mediaType, data: base64 };
                }
                return null;
              })
              .filter(
                (
                  v: any,
                ): v is { filename: string; mimeType: string; data: string } =>
                  !!v,
              );

            const args: Record<string, unknown> =
              urls.length > 0
                ? { urls }
                : dataFiles.length > 0
                  ? { files: dataFiles }
                  : {};

            if (Object.keys(args).length > 0) {
              const conversion = await mcpClientsManager
                .toolCallByServerName(serverName, originToolName, args)
                .catch(() => null);

              const contents: any[] = Array.isArray(
                (conversion as any)?.content,
              )
                ? ((conversion as any).content as any[])
                : [];
              const convertedText = contents
                .filter((c: any) => c?.type === "text" && c?.text)
                .map((c: any) =>
                  typeof c.text === "string" ? c.text : JSON.stringify(c.text),
                )
                .join("\n\n");

              if (convertedText) {
                // Remove file parts and append the converted text instead
                const nonFileParts = (message.parts || []).filter(
                  (p: any) => p?.type !== "file",
                );
                message.parts = [
                  ...nonFileParts,
                  { type: "text", text: convertedText },
                ];
              }
            }
          }
        } catch {
          // Fail open: ignore preprocessing errors and continue normally
        }

        const inProgressToolParts = extractInProgressToolPart(message);
        if (inProgressToolParts.length) {
          await Promise.all(
            inProgressToolParts.map(async (part) => {
              const output = await manualToolExecuteByLastMessage(
                part,
                { ...MCP_TOOLS, ...WORKFLOW_TOOLS, ...APP_DEFAULT_TOOLS },
                request.signal,
              );
              part.output = output;

              dataStream.write({
                type: "tool-output-available",
                toolCallId: part.toolCallId,
                output,
              });
            }),
          );
        }

        const userPreferences = thread?.userPreferences || undefined;

        const mcpServerCustomizations = await safe()
          .map(() => {
            if (Object.keys(MCP_TOOLS ?? {}).length === 0)
              throw new Error("No tools found");
            return rememberMcpServerCustomizationsAction(session.user.id);
          })
          .map((v) => filterMcpServerCustomizations(MCP_TOOLS!, v))
          .orElse({});

        const systemPrompt = mergeSystemPrompt(
          buildUserSystemPrompt(session.user, userPreferences, agent),
          buildMcpServerCustomizationsSystemPrompt(mcpServerCustomizations),
          !supportToolCall && buildToolCallUnsupportedModelSystemPrompt,
        );

        const vercelAITooles = safe({ ...MCP_TOOLS, ...WORKFLOW_TOOLS })
          .map((t) => {
            const bindingTools =
              toolChoice === "manual" ||
              (message.metadata as ChatMetadata)?.toolChoice === "manual"
                ? excludeToolExecution(t)
                : t;
            return {
              ...bindingTools,
              ...APP_DEFAULT_TOOLS, // APP_DEFAULT_TOOLS Not Supported Manual
            };
          })
          .unwrap();
        metadata.toolCount = Object.keys(vercelAITooles).length;

        const allowedMcpTools = Object.values(allowedMcpServers ?? {})
          .map((t) => t.tools)
          .flat();

        logger.info(
          `${agent ? `agent: ${agent.name}, ` : ""}tool mode: ${toolChoice}, mentions: ${mentions.length}`,
        );

        logger.info(
          `allowedMcpTools: ${allowedMcpTools.length ?? 0}, allowedAppDefaultToolkit: ${allowedAppDefaultToolkit?.length ?? 0}`,
        );
        logger.info(
          `binding tool count APP_DEFAULT: ${Object.keys(APP_DEFAULT_TOOLS ?? {}).length}, MCP: ${Object.keys(MCP_TOOLS ?? {}).length}, Workflow: ${Object.keys(WORKFLOW_TOOLS ?? {}).length}`,
        );
        logger.info(`model: ${chatModel?.provider}/${chatModel?.model}`);

        // If user explicitly enabled image generation, or current selection is image-capable/image-only, run image generation branch
        const shouldGenerateImage = Boolean(imageSettings?.enabled) ||
          isImageOnlyModel(chatModel) || isImageCapableModel(chatModel);

        if (shouldGenerateImage) {
          const promptText = (message.parts || [])
            .filter((p: any) => p?.type === "text")
            .map((p: any) => p.text)
            .join("\n")
            .trim();

          // Select engine (default auto→by provider)
          let engine = (imageSettings?.engine || chatModel?.provider || "openai").toLowerCase();
          if (engine === "auto") {
            engine = (chatModel?.provider || "openai").toLowerCase();
          }

          const size = (imageSettings?.size as any) || undefined;
          const aspectRatio = (imageSettings?.aspectRatio as any) || undefined;
          const extraProviderOptions = imageSettings?.providerOptions || {};

          let imageBase64 = "";
          let imageMediaType = "image/png";

          if (engine === "openai") {
          const keyMeta = await UserKeyService.getKeyWithMeta(session.user.id, "openai");
          const apiKey = keyMeta?.apiKey || process.env.OPENAI_API_KEY || "";
          if (!apiKey) {
            const hint = userPreferences?.useAIGateway || userPreferences?.useOpenRouter
              ? " (AI Gateway/OpenRouter не поддерживают генерацию изображений; требуется ключ OpenAI)"
              : "";
            throw new Error(`User OpenAI key is not configured${hint}`);
          }
          const openaiWithKey = createOpenAI({ apiKey, baseURL: keyMeta?.baseUrl || undefined });

          const providerOptions: Record<string, any> = { openai: {} };
            const modelName = imageSettings?.imageModel || chatModel?.model || "gpt-image-1";
            if (modelName === "dall-e-3" && imageSettings?.style) {
              providerOptions.openai.style = imageSettings.style;
            }
          if (modelName === "dall-e-3" || modelName === "dall-e-2") {
            let mappedQuality = imageSettings?.quality;
              if (mappedQuality === "low" || mappedQuality === "medium") mappedQuality = "standard";
              else if (mappedQuality === "high" || mappedQuality === "auto") mappedQuality = "hd";
              if (mappedQuality === "standard" || mappedQuality === "hd") providerOptions.openai.quality = mappedQuality;
            }

          const { image } = await experimental_generateImage({
              model: openaiWithKey.image(modelName),
              prompt: promptText,
              ...(size ? { size } : {}),
              ...(aspectRatio ? { aspectRatio } : {}),
              providerOptions: { ...providerOptions, ...extraProviderOptions },
            });
            imageBase64 = image.base64;
            imageMediaType = image.mediaType;
          } else if (engine === "google") {
            const keyMeta = await UserKeyService.getKeyWithMeta(session.user.id, "google");
            const apiKey = keyMeta?.apiKey || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
            if (!apiKey) {
              const hint = userPreferences?.useAIGateway || userPreferences?.useOpenRouter
                ? " (AI Gateway/OpenRouter не поддерживают генерацию изображений; требуется ключ Google Generative AI)"
                : "";
              throw new Error(`User Google key is not configured${hint}`);
            }
            const googleProvider = createGoogleGenerativeAI({ apiKey, baseURL: keyMeta?.baseUrl || undefined });
            const modelName = imageSettings?.imageModel || chatModel?.model || "imagen-3.0-generate-002";
            const { image } = await experimental_generateImage({
              model: googleProvider.image(modelName),
              prompt: promptText,
              ...(aspectRatio ? { aspectRatio } : {}),
              providerOptions: { google: {}, ...extraProviderOptions },
            });
            imageBase64 = image.base64;
            imageMediaType = image.mediaType;
          } else if (engine === "fal") {
            const keyMeta = await UserKeyService.getKeyWithMeta(session.user.id, "fal");
            const apiKey = keyMeta?.apiKey || process.env.FAL_API_KEY || process.env.FAL_KEY || "";
            const falProvider = createFal({ apiKey, baseURL: keyMeta?.baseUrl || undefined });
            const modelName = imageSettings?.imageModel || chatModel?.model || "fal-ai/flux/dev";
            const { image } = await experimental_generateImage({
              model: falProvider.image(modelName),
              prompt: promptText,
              providerOptions: { fal: {}, ...extraProviderOptions },
            });
            imageBase64 = image.base64;
            imageMediaType = image.mediaType;
          } else if (engine === "luma") {
            const keyMeta = await UserKeyService.getKeyWithMeta(session.user.id, "luma");
            const apiKey = keyMeta?.apiKey || process.env.LUMA_API_KEY || "";
            const lumaProvider = createLuma({ apiKey, baseURL: keyMeta?.baseUrl || undefined });
            const modelName = imageSettings?.imageModel || chatModel?.model || "photon-1";
            const { image } = await experimental_generateImage({
              model: lumaProvider.image(modelName),
              prompt: promptText,
              ...(aspectRatio ? { aspectRatio } : {}),
              providerOptions: { luma: {}, ...extraProviderOptions },
            });
            imageBase64 = image.base64;
            imageMediaType = image.mediaType;
          } else if (engine === "replicate") {
            const keyMeta = await UserKeyService.getKeyWithMeta(session.user.id, "replicate");
            const apiToken = keyMeta?.apiKey || process.env.REPLICATE_API_TOKEN || "";
            if (!apiToken) throw new Error("User Replicate token is not configured");
            const replicateProvider = createReplicate({ apiToken, baseURL: keyMeta?.baseUrl || undefined });
            const modelName = imageSettings?.imageModel || chatModel?.model || "black-forest-labs/flux-schnell";
            const { image } = await experimental_generateImage({
              model: replicateProvider.image(modelName),
            prompt: promptText,
            ...(size ? { size } : {}),
            ...(aspectRatio ? { aspectRatio } : {}),
              providerOptions: { replicate: {}, ...extraProviderOptions },
            });
            imageBase64 = image.base64;
            imageMediaType = image.mediaType;
          } else {
            throw new Error(`Selected engine '${engine}' is not implemented`);
          }

          const dataUrl = imageBase64.startsWith("data:")
            ? imageBase64
            : `data:${imageMediaType};base64,${imageBase64}`;

          const assistantMessage: UIMessage = {
            id: generateUUID(),
            role: "assistant",
            parts: [{ type: "text", text: `![image](${dataUrl})` }],
            metadata,
          };

          // write assistant text events to stream and store for onFinish persistence
          const streamMessageId = generateUUID();
          dataStream.write({ type: "text-start", id: streamMessageId });
          dataStream.write({
            type: "text-delta",
            id: streamMessageId,
            delta:
              assistantMessage.parts[0].type === "text"
                ? (assistantMessage.parts[0] as any).text
                : `![image](${dataUrl})`,
          });
          dataStream.write({ type: "text-end", id: streamMessageId });
          dataStream.write({ type: "finish" });
          generatedImageMessage = assistantMessage;
          return; // skip normal text streaming
        }

        const result = streamText({
          model,
          system: systemPrompt,
          messages: convertToModelMessages(messages),
          experimental_transform: smoothStream({ chunking: "word" }),
          maxRetries: 2,
          tools: vercelAITooles,
          stopWhen: stepCountIs(10),
          toolChoice: "auto",
          abortSignal: request.signal,
        });
        result.consumeStream();
        dataStream.merge(
          result.toUIMessageStream({
            messageMetadata: ({ part }) => {
              if (part.type == "finish") {
                metadata.usage = part.totalUsage;
                return metadata;
              }
            },
          }),
        );
      },

      generateId: generateUUID,
      onFinish: async ({ responseMessage }) => {
        // Ensure EXA key is cleared after the conversation finishes
        clearExaApiKey();
        if (generatedImageMessage) {
          // Persist user message then assistant image message
          await chatRepository.upsertMessage({
            threadId: thread!.id,
            role: message.role,
            parts: message.parts.map(convertToSavePart),
            id: message.id,
          });
          await chatRepository.upsertMessage({
            threadId: thread!.id,
            ...generatedImageMessage,
            parts: generatedImageMessage.parts.map(convertToSavePart),
            metadata,
          });
          if (agent) {
            agentRepository.updateAgent(agent.id, session.user.id, {
              updatedAt: new Date(),
            } as any);
          }
          return;
        }
        if (responseMessage.id == message.id) {
          await chatRepository.upsertMessage({
            threadId: thread!.id,
            ...responseMessage,
            parts: responseMessage.parts.map(convertToSavePart),
            metadata,
          });
        } else {
          await chatRepository.upsertMessage({
            threadId: thread!.id,
            role: message.role,
            parts: message.parts.map(convertToSavePart),
            id: message.id,
          });
          await chatRepository.upsertMessage({
            threadId: thread!.id,
            role: responseMessage.role,
            id: responseMessage.id,
            parts: responseMessage.parts.map(convertToSavePart),
            metadata,
          });
        }

        if (agent) {
          agentRepository.updateAgent(agent.id, session.user.id, {
            updatedAt: new Date(),
          } as any);
        }
      },
      onError: (e) => {
        // Clear EXA key even if error happens
        clearExaApiKey();
        return handleError(e);
      },
      originalMessages: messages,
    });

    return createUIMessageStreamResponse({
      stream,
    });
  } catch (error: any) {
    logger.error(error);
    return Response.json({ message: error.message }, { status: 500 });
  }
}
