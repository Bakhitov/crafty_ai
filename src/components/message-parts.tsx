"use client";

import { getToolName, ToolUIPart, UIMessage } from "ai";
import {
  Check,
  Copy,
  Loader,
  Pencil,
  ChevronDownIcon,
  ChevronLeft,
  ChevronUp,
  RefreshCw,
  RefreshCcw,
  X,
  Trash2,
  ChevronRight,
  TriangleAlert,
  HammerIcon,
  Download,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { Dialog, DialogContent } from "ui/dialog";
import { Button } from "ui/button";
import { Markdown } from "./markdown";
import { cn, safeJSONParse, truncateString } from "lib/utils";
import JsonView from "ui/json-view";
import { useMemo, useState, memo, useEffect, useRef, useCallback } from "react";
import { MessageEditor } from "./message-editor";
import type { UseChatHelpers } from "@ai-sdk/react";
import { useCopy } from "@/hooks/use-copy";

import { AnimatePresence, motion } from "framer-motion";
import { SelectModel } from "./select-model";
import {
  deleteMessageAction,
  deleteMessagesByChatIdAfterTimestampAction,
} from "@/app/api/chat/actions";

import { toast } from "sonner";
import { safe } from "ts-safe";
import { ChatMetadata, ChatModel, ManualToolConfirmTag } from "app-types/chat";

import { useTranslations } from "next-intl";
import { extractMCPToolId } from "lib/ai/mcp/mcp-tool-id";
import { Separator } from "ui/separator";

import { TextShimmer } from "ui/text-shimmer";
import equal from "lib/equal";
import {
  VercelAIWorkflowToolStreamingResult,
  VercelAIWorkflowToolStreamingResultTag,
} from "app-types/workflow";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { DefaultToolName } from "lib/ai/tools";
import {
  Shortcut,
  getShortcutKeyList,
  isShortcutEvent,
} from "lib/keyboard-shortcuts";

import { WorkflowInvocation } from "./tool-invocation/workflow-invocation";
import dynamic from "next/dynamic";
import { notify } from "lib/notify";
import { ModelProviderIcon } from "ui/model-provider-icon";
import { appStore } from "@/app/store";
import { BACKGROUND_COLORS, EMOJI_DATA } from "lib/const";
import { getStorageManager } from "lib/browser-stroage";
import { LiaCoinsSolid } from "react-icons/lia";
import { RiImageCircleAiFill } from "react-icons/ri";

// Helpers to extract image URLs from plain text
const IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".ico",
  ".tiff",
  ".tif",
];
function looksLikeImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.startsWith("data:image/")) return true;
  return IMAGE_EXTENSIONS.some((ext) => lower.includes(ext));
}
function extractImageUrls(text: string): string[] {
  if (!text) return [];
  const urls = new Set<string>();
  const urlRegex = /(https?:\/\/[^\s)\]\"']+)/gi;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    const candidate = match[1];
    if (looksLikeImageUrl(candidate)) {
      urls.add(candidate);
    }
  }
  // Also capture data URLs pasted directly
  const dataUrlRegex = /(data:image\/[a-zA-Z0-9+.-]+;base64,[a-zA-Z0-9+/=]+)/gi;
  while ((match = dataUrlRegex.exec(text)) !== null) {
    urls.add(match[1]);
  }
  return Array.from(urls);
}

function ImageLightbox({
  src,
  alt,
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const filenameFromSrc = (s: string) => {
    try {
      if (s.startsWith("data:")) {
        const mime = s.substring(5, s.indexOf(";"));
        const ext = mime.split("/")[1] || "png";
        return `image.${ext}`;
      }
      const u = new URL(s);
      const base = u.pathname.split("/").pop() || "image";
      return base.includes(".") ? base : `${base}.png`;
    } catch {
      return "image.png";
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      let dataUrl = src;
      if (!src.startsWith("data:")) {
        const res = await fetch(src);
        const blob = await res.blob();
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("Failed to read image"));
          reader.readAsDataURL(blob);
        });
      }
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filenameFromSrc(src);
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      toast.error(String(err?.message || "Failed to download image"));
    }
  };

  return (
    <div className={cn("relative inline-block group", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || "image"}
        className={cn("cursor-zoom-in", className)}
        onClick={() => setOpen(true)}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-1 right-1 h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
            onClick={handleDownload}
          >
            <Download className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Download</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] p-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || "image"}
            className="w-auto h-auto max-w-[90vw] max-h-[90vh] rounded-md"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

type MessagePart = UIMessage["parts"][number];
type TextMessagePart = Extract<MessagePart, { type: "text" }>;
type AssistMessagePart = Extract<MessagePart, { type: "text" }>;

interface UserMessagePartProps {
  part: TextMessagePart;
  isLast: boolean;
  message: UIMessage;
  setMessages: UseChatHelpers<UIMessage>["setMessages"];
  sendMessage: UseChatHelpers<UIMessage>["sendMessage"];
  status: UseChatHelpers<UIMessage>["status"];
  isError?: boolean;
}

interface AssistMessagePartProps {
  part: AssistMessagePart;
  isLast: boolean;
  isLoading: boolean;
  message: UIMessage;
  prevMessage: UIMessage;
  showActions: boolean;
  threadId?: string;
  setMessages: UseChatHelpers<UIMessage>["setMessages"];
  sendMessage: UseChatHelpers<UIMessage>["sendMessage"];
  isError?: boolean;
}

interface ToolMessagePartProps {
  part: ToolUIPart;
  messageId: string;
  showActions: boolean;
  isLast?: boolean;
  isManualToolInvocation?: boolean;
  addToolResult?: UseChatHelpers<UIMessage>["addToolResult"];
  isError?: boolean;
  setMessages?: UseChatHelpers<UIMessage>["setMessages"];
  hideTitle?: boolean;
  alwaysExpanded?: boolean;
}

const MAX_TEXT_LENGTH = 600;
export const UserMessagePart = memo(
  function UserMessagePart({
    part,
    isLast,
    status,
    message,
    setMessages,
    sendMessage,
    isError,
  }: UserMessagePartProps) {
    const { copied, copy } = useCopy();
    const t = useTranslations();
    const [mode, setMode] = useState<"view" | "edit">("view");
    const [isDeleting, setIsDeleting] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const scrolledRef = useRef(false);
    const imageUrls = useMemo(() => extractImageUrls(part.text), [part.text]);

    const isLongText = part.text.length > MAX_TEXT_LENGTH;
    const displayText =
      expanded || !isLongText
        ? part.text
        : truncateString(part.text, MAX_TEXT_LENGTH);

    const deleteMessage = useCallback(async () => {
      const ok = await notify.confirm({
        title: "Delete Message",
        description: "Are you sure you want to delete this message?",
      });
      if (!ok) return;
      safe(() => setIsDeleting(true))
        .ifOk(() => deleteMessageAction(message.id))
        .ifOk(() =>
          setMessages((messages) => {
            const index = messages.findIndex((m) => m.id === message.id);
            if (index !== -1) {
              return messages.filter((_, i) => i !== index);
            }
            return messages;
          }),
        )
        .ifFail((error) => toast.error(error.message))
        .watch(() => setIsDeleting(false))
        .unwrap();
    }, [message.id]);

    useEffect(() => {
      if (status === "submitted" && isLast && !scrolledRef.current) {
        scrolledRef.current = true;
        ref.current?.scrollIntoView({ behavior: "smooth" });
      }
    }, [status]);

    if (mode === "edit") {
      return (
        <div className="flex flex-row gap-2 items-start w-full">
          <MessageEditor
            message={message}
            setMode={setMode}
            setMessages={setMessages}
            sendMessage={sendMessage}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 items-end my-2">
        <div
          data-testid="message-content"
          className={cn(
            "flex flex-col gap-4 max-w-full ring ring-input relative overflow-hidden",
            {
              "bg-accent text-accent-foreground px-4 py-3 rounded-2xl": isLast,
              "opacity-50": isError,
            },
            isError && "border-destructive border",
          )}
        >
          {isLongText && !expanded && (
            <div className="absolute pointer-events-none bg-gradient-to-t from-accent to-transparent w-full h-40 bottom-0 left-0" />
          )}
          <p className={cn("whitespace-pre-wrap text-sm break-words")}>
            {displayText}
          </p>
          {imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {imageUrls.map((src, i) => (
                <ImageLightbox
                  key={`${message.id}-img-${i}`}
                  src={src}
                  alt="image"
                  className="max-h-96 md:max-h-[28rem] rounded-md border bg-background"
                />
              ))}
            </div>
          )}
          {isLongText && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-auto p-1 text-xs z-10 text-muted-foreground hover:text-foreground self-start"
            >
              <span className="flex items-center gap-1">
                {t(expanded ? "Common.showLess" : "Common.showMore")}
                {expanded ? (
                  <ChevronUp className="size-3" />
                ) : (
                  <ChevronDownIcon className="size-3" />
                )}
              </span>
            </Button>
          )}
        </div>
        {isLast && (
          <div className="flex w-full justify-end opacity-0 group-hover/message:opacity-100 transition-opacity duration-300">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="message-edit-button"
                  variant="ghost"
                  size="icon"
                  className={cn("size-3! p-4!")}
                  onClick={() => copy(part.text)}
                >
                  {copied ? <Check /> : <Copy />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Copy</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  data-testid="message-edit-button"
                  variant="ghost"
                  size="icon"
                  className="size-3! p-4!"
                  onClick={() => setMode("edit")}
                >
                  <Pencil />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Edit</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  disabled={isDeleting}
                  onClick={deleteMessage}
                  variant="ghost"
                  size="icon"
                  className="size-3! p-4! hover:text-destructive"
                >
                  {isDeleting ? (
                    <Loader className="animate-spin" />
                  ) : (
                    <Trash2 />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-destructive" side="bottom">
                Delete Message
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        <div ref={ref} className="min-w-0" />
      </div>
    );
  },
  (prev, next) => {
    if (prev.part.text != next.part.text) return false;
    if (prev.isError != next.isError) return false;
    if (prev.isLast != next.isLast) return false;
    if (prev.status != next.status) return false;
    if (prev.message.id != next.message.id) return false;
    if (!equal(prev.part, next.part)) return false;
    return true;
  },
);
UserMessagePart.displayName = "UserMessagePart";

export const AssistMessagePart = memo(function AssistMessagePart({
  part,
  showActions,
  message,
  prevMessage,
  isError,
  threadId,
  setMessages,
  sendMessage,
  isLoading,
}: AssistMessagePartProps) {
  const { copied, copy } = useCopy();
  const [isRetryLoading, setIsRetryLoading] = useState(false);
  const agentList = appStore((state) => state.agentList);
  const [isDeleting, setIsDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const metadata = message.metadata as ChatMetadata | undefined;
  // Branch state (per previous user message)
  const branchKey = prevMessage?.id || "";
  const branchStorage = useMemo(() => getStorageManager("BRANCHES"), []);
  const imagePrefStorage = useMemo(() => getStorageManager("IMAGE_PREFS"), []);
  const [branchIndex, setBranchIndex] = useState<number>(0);
  const [branchVariants, setBranchVariants] = useState<string[]>([]);

  // Initialize/merge current variant into storage and local state
  useEffect(() => {
    // Не фиксируем варианты во время стриминга — иначе каждый текстовый дельта станет отдельной "веткой"
    if (isLoading) return;
    try {
      const raw = (branchStorage.get() as any) || {};
      const entry = raw[branchKey] || { variants: [], index: 0 };
      let variants: string[] = Array.isArray(entry.variants)
        ? [...entry.variants]
        : [];
      const current = part.text || "";
      let appended = false;
      if (variants.length === 0) {
        variants = [current];
        appended = true;
      } else if (variants[variants.length - 1] !== current) {
        variants = [...variants, current];
        appended = true;
      }
      const index = appended
        ? variants.length - 1 // при появлении нового варианта показываем его сразу
        : Math.min(entry.index ?? variants.length - 1, variants.length - 1);
      raw[branchKey] = { variants, index };
      branchStorage.set(raw);
      setBranchVariants(variants);
      setBranchIndex(index);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchKey, part.text, isLoading]);

  const displayedText = useMemo(() => {
    return branchVariants[branchIndex] ?? part.text;
  }, [branchVariants, branchIndex, part.text]);

  const imageUrls = useMemo(() => extractImageUrls(displayedText), [displayedText]);
  const firstDataUrl = useMemo(() => {
    // Prefer a data URL to render via AIImage; fall back to plain <img>
    return imageUrls.find((u) => u.startsWith("data:image/"));
  }, [imageUrls]);
  const hasImageFilePart = useMemo(() => {
    try {
      return (message?.parts || []).some((p: any) => p?.type === "file" && typeof p?.mediaType === "string" && p.mediaType.toLowerCase().startsWith("image/"));
    } catch {
      return false;
    }
  }, [message?.parts]);
  const isImageReply = useMemo(() => Boolean(firstDataUrl) || hasImageFilePart, [firstDataUrl, hasImageFilePart]);

  const agent = useMemo(() => {
    return agentList.find((a) => a.id === metadata?.agentId);
  }, [metadata, agentList]);

  const deleteMessage = useCallback(async () => {
    const ok = await notify.confirm({
      title: "Delete Message",
      description: "Are you sure you want to delete this message?",
    });
    if (!ok) return;
    safe(() => setIsDeleting(true))
      .ifOk(() => deleteMessageAction(message.id))
      .ifOk(() =>
        setMessages((messages) => {
          const index = messages.findIndex((m) => m.id === message.id);
          if (index !== -1) {
            return messages.filter((_, i) => i !== index);
          }
          return messages;
        }),
      )
      .ifFail((error) => toast.error(error.message))
      .watch(() => setIsDeleting(false))
      .unwrap();
  }, [message.id]);

  const handleRetry = useCallback(() => {
    // Повторить последний запрос пользователя перед этим ответом
    safe(() => setIsRetryLoading(true))
      .ifOk(() =>
        threadId
          ? deleteMessagesByChatIdAfterTimestampAction(prevMessage.id)
          : Promise.resolve(),
      )
      .ifOk(() =>
        setMessages((messages) => {
          const index = messages.findIndex((m) => m.id === prevMessage.id);
          if (index !== -1) {
            return [...messages.slice(0, index)];
          }
          return messages;
        }),
      )
      .ifOk(() =>
        {
          if (isImageReply) {
            // Попробовать вспомнить последнюю картинную модель для этого треда
            const saved = (() => {
              try {
                const raw = (imagePrefStorage.get() as any) || {};
                return raw[threadId || ""] as { provider?: string; imageModel?: string } | undefined;
              } catch {
                return undefined;
              }
            })();
            const provider = saved?.provider || metadata?.chatModel?.provider || "auto";
            const defaultImageModelByProvider: Record<string, string> = {
              openai: "gpt-image-1",
              google: "imagen-3.0-generate-002",
              fal: "fal-ai/flux/dev",
              luma: "photon-1",
              replicate: "black-forest-labs/flux-schnell",
            };
            const defaultImageModel = saved?.imageModel || defaultImageModelByProvider[provider] || "gpt-image-1";
            return sendMessage(prevMessage, {
              body: {
                imageSettings: {
                  enabled: true,
                  engine: provider,
                  imageModel: defaultImageModel,
                },
              },
            });
          }
          return sendMessage(prevMessage, {
            body: metadata?.chatModel ? { model: metadata.chatModel } : undefined,
          });
        },
      )
      .ifFail((error) => toast.error((error as Error).message))
      .watch(() => setIsRetryLoading(false))
      .unwrap();
  }, [prevMessage, metadata?.chatModel, threadId, message.id]);

  // removed old text+media download function; download is available per-image only

  const handleModelChange = (model: ChatModel) => {
    // Перегенерируем предыдущий запрос пользователя с новой моделью
    safe(() => setIsRetryLoading(true))
      .ifOk(() =>
        threadId
          ? deleteMessagesByChatIdAfterTimestampAction(prevMessage.id)
          : Promise.resolve(),
      )
      .ifOk(() =>
        setMessages((messages) => {
          const index = messages.findIndex((m) => m.id === prevMessage.id);
          if (index !== -1) {
            return [...messages.slice(0, index)];
          }
          return messages;
        }),
      )
      .ifOk(() =>
        {
          if (isImageReply) {
            const provider = model.provider || "auto";
            // используем выбранную модель как imageModel, если это image‑совместимая строка
            const imageModel = model.model;
            // Запомнить выбор для треда
            try {
              const raw = (imagePrefStorage.get() as any) || {};
              raw[threadId || ""] = { provider, imageModel };
              imagePrefStorage.set(raw);
            } catch {}
            return sendMessage(prevMessage, {
              body: {
                imageSettings: {
                  enabled: true,
                  engine: provider,
                  imageModel,
                },
              },
            });
          }
          return sendMessage(prevMessage, {
            body: {
              model,
            },
          });
        },
      )
      .ifFail((error) => toast.error(error.message))
      .watch(() => setIsRetryLoading(false))
      .unwrap();
  };

  return (
    <div
      className={cn(
        (isLoading || isRetryLoading) && "animate-pulse",
        "flex flex-col gap-2 group/message",
      )}
    >
      <div
        data-testid="message-content"
        className={cn("flex flex-col gap-4 px-2", {
          "opacity-50 border border-destructive bg-card rounded-lg": isError,
        })}
      >
        <Markdown>{displayedText}</Markdown>
        {firstDataUrl ? (
          <div className="flex flex-wrap gap-2 mt-1">
            <ImageLightbox
              src={firstDataUrl}
              alt="image"
              className="max-h-112 md:max-h-[32rem] rounded-md border bg-background"
            />
          </div>
        ) : imageUrls.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-1">
            {imageUrls.map((src, i) => (
              <ImageLightbox
                key={`${message.id}-assist-img-${i}`}
                src={src}
                alt="image"
                className="max-h-112 md:max-h-[32rem] rounded-md border bg-background"
              />
            ))}
          </div>
        ) : null}
      </div>
      {showActions && (
        <div className="flex w-full items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity duration-300">
          {branchVariants.length > 1 && (
            <div className="mr-1 flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-3! p-4!"
                    disabled={branchIndex <= 0}
                    onClick={() => {
                      const raw = (branchStorage.get() as any) || {};
                      const entry = raw[branchKey] || { variants: [], index: 0 };
                      const prevIndex = Math.max(0, (entry.index ?? 0) - 1);
                      raw[branchKey] = { variants: entry.variants || [], index: prevIndex };
                      branchStorage.set(raw);
                      setBranchIndex(prevIndex);
                    }}
                  >
                    <ChevronLeft />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous</TooltipContent>
              </Tooltip>
              <span className="text-[11px] text-muted-foreground min-w-10 text-center">
                {branchIndex + 1} / {branchVariants.length}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-3! p-4!"
                    onClick={() => {
                      const raw = (branchStorage.get() as any) || {};
                      const entry = raw[branchKey] || { variants: [], index: 0 };
                      const last = Math.max(0, (entry.variants?.length || 1) - 1);
                      const nextIndex = Math.min((entry.index ?? 0) + 1, last);
                      raw[branchKey] = { variants: entry.variants || [], index: nextIndex };
                      branchStorage.set(raw);
                      setBranchIndex(nextIndex);
                    }}
                    disabled={branchIndex >= Math.max(0, (branchVariants.length || 1) - 1)}
                  >
                    <ChevronRight />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next</TooltipContent>
              </Tooltip>
            </div>
          )}
          {/* Убрали UI веток, т.к. страница одна. Оставляем только действия: Copy / Change Model / Retry / Delete */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-testid="message-edit-button"
                variant="ghost"
                size="icon"
                className="size-3! p-4!"
                onClick={() => copy(part.text)}
              >
                {copied ? <Check /> : <Copy />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <SelectModel onSelect={handleModelChange} mode={isImageReply ? "image" : "text"}>
                  <Button
                    data-testid="message-edit-button data-[state=open]:bg-secondary!"
                    variant="ghost"
                    size="icon"
                    className="size-3! p-4!"
                  >
                    {metadata?.chatModel?.provider ? (
                      <ModelProviderIcon
                        provider={metadata.chatModel.provider}
                        className="size-4"
                      />
                    ) : firstDataUrl ? (
                      <RiImageCircleAiFill className="size-4" />
                    ) : (
                      <RefreshCw />
                    )}
                  </Button>
                </SelectModel>
              </div>
            </TooltipTrigger>
            <TooltipContent>Change Model</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-3! p-4!"
                onClick={handleRetry}
              >
                <RefreshCcw />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Retry</TooltipContent>
          </Tooltip>
          {/* Убрали общий Download для текста — остаётся только Copy. Скачивание доступно на превью изображений. */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={isDeleting}
                onClick={deleteMessage}
                className="size-3! p-4! hover:text-destructive"
              >
                {isDeleting ? <Loader className="animate-spin" /> : <Trash2 />}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-destructive">
              Delete Message
            </TooltipContent>
          </Tooltip>
          {metadata && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-3! p-4! opacity-0 group-hover/message:opacity-100 transition-opacity duration-300"
                >
                  <LiaCoinsSolid />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="p-4 w-72 bg-card border shadow-lg">
                <div className="space-y-4">
                  {agent && (
                    <>
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">
                          Agent
                        </h4>
                        <div className="flex gap-3 items-center">
                          <div
                            className="p-1.5 rounded-full ring-2 ring-border/50 bg-background shadow-sm"
                            style={{
                              backgroundColor:
                                agent.icon?.style?.backgroundColor ||
                                BACKGROUND_COLORS[0],
                            }}
                          >
                            <Avatar className="size-3">
                              <AvatarImage
                                src={agent.icon?.value || EMOJI_DATA[0]}
                              />
                              <AvatarFallback className="bg-transparent text-xs">
                                {agent.name[0]}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <span className="font-medium text-sm">
                            {agent.name}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-border/50" />
                    </>
                  )}

                  {metadata.chatModel && (
                    <>
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">
                          Model
                        </h4>
                        <div className="flex gap-3 items-center">
                          <ModelProviderIcon
                            provider={metadata.chatModel.provider}
                            className="size-5 flex-shrink-0"
                          />
                          <div className="space-y-0.5 flex-1">
                            <div className="text-sm font-medium text-foreground">
                              {metadata.chatModel.provider}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {metadata.chatModel.model}
                              {metadata.toolCount !== undefined &&
                                metadata.toolCount > 0 && (
                                  <span className="ml-2">
                                    • {metadata.toolCount} tools
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-border/50" />
                    </>
                  )}

                  {metadata.usage && (
                    <>
                      <div className="flex flex-col gap-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <LiaCoinsSolid className="size-4" />
                          Token Usage
                          <span className="text-xs text-muted-foreground font-normal">
                            {
                              message.parts.filter(
                                (v) => v.type != "step-start",
                              ).length
                            }{" "}
                            Steps
                          </span>
                        </h4>
                        <p className="px-2 mb-2 text-xs text-muted-foreground">
                          High input token usage may occur when many tools are
                          available.
                        </p>
                        <div className="space-y-2">
                          {metadata.usage.inputTokens !== undefined && (
                            <div className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/30">
                              <span className="text-xs text-muted-foreground">
                                Input
                              </span>
                              <span className="text-xs font-mono font-medium">
                                {metadata.usage.inputTokens.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {metadata.usage.outputTokens !== undefined && (
                            <div className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/30">
                              <span className="text-xs text-muted-foreground">
                                Output
                              </span>
                              <span className="text-xs font-mono font-medium">
                                {metadata.usage.outputTokens.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {metadata.usage.totalTokens !== undefined && (
                            <div className="flex items-center justify-between py-1.5 px-2 rounded-md bg-primary/10 border border-primary/20">
                              <span className="text-xs font-medium text-primary">
                                Total
                              </span>
                              <span className="text-xs font-mono font-bold text-primary">
                                {metadata.usage.totalTokens.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
      <div ref={ref} className="min-w-0" />
    </div>
  );
});
AssistMessagePart.displayName = "AssistMessagePart";
const variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  expanded: {
    height: "auto",
    opacity: 1,
    marginTop: "1rem",
    marginBottom: "0.5rem",
  },
};
export const ReasoningPart = memo(function ReasoningPart({
  reasoningText,
  isThinking,
}: {
  reasoningText: string;
  isThinking?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(isThinking);

  useEffect(() => {
    if (!isThinking && isExpanded) {
      setIsExpanded(false);
    }
  }, [isThinking]);

  return (
    <div
      className="flex flex-col cursor-pointer"
      onClick={() => {
        setIsExpanded(!isExpanded);
      }}
    >
      <div className="flex flex-row gap-2 items-center text-ring hover:text-primary transition-colors">
        {isThinking ? (
          <TextShimmer>Reasoning...</TextShimmer>
        ) : (
          <div className="font-medium">Reasoning...</div>
        )}

        <button
          data-testid="message-reasoning-toggle"
          type="button"
          className="cursor-pointer"
        >
          <ChevronDownIcon size={16} />
        </button>
      </div>

      <div className="pl-4">
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              data-testid="message-reasoning"
              key="content"
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              variants={variants}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
              className="pl-6 text-muted-foreground border-l flex flex-col gap-4"
            >
              <Markdown>
                {reasoningText || (isThinking ? "" : "Hmm, let's see...🤔")}
              </Markdown>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
ReasoningPart.displayName = "ReasoningPart";

const loading = memo(function Loading() {
  return (
    <div className="px-6 py-4">
      <div className="h-44 w-full rounded-md opacity-0" />
    </div>
  );
});

const PieChart = dynamic(
  () => import("./tool-invocation/pie-chart").then((mod) => mod.PieChart),
  {
    ssr: false,
    loading,
  },
);

const BarChart = dynamic(
  () => import("./tool-invocation/bar-chart").then((mod) => mod.BarChart),
  {
    ssr: false,
    loading,
  },
);

const LineChart = dynamic(
  () => import("./tool-invocation/line-chart").then((mod) => mod.LineChart),
  {
    ssr: false,
    loading,
  },
);

const InteractiveTable = dynamic(
  () =>
    import("./tool-invocation/interactive-table").then(
      (mod) => mod.InteractiveTable,
    ),
  {
    ssr: false,
    loading,
  },
);

const WebSearchToolInvocation = dynamic(
  () =>
    import("./tool-invocation/web-search").then(
      (mod) => mod.WebSearchToolInvocation,
    ),
  {
    ssr: false,
    loading,
  },
);

const CodeExecutor = dynamic(
  () =>
    import("./tool-invocation/code-executor").then((mod) => mod.CodeExecutor),
  {
    ssr: false,
    loading,
  },
);

// Local shortcuts for tool invocation approval/rejection
const approveToolInvocationShortcut: Shortcut = {
  description: "approveToolInvocation",
  shortcut: {
    key: "Enter",
    command: true,
  },
};

const rejectToolInvocationShortcut: Shortcut = {
  description: "rejectToolInvocation",
  shortcut: {
    key: "Escape",
    command: true,
  },
};

export const ToolMessagePart = memo(
  ({
    part,
    isLast,
    showActions,
    addToolResult,

    isError,
    messageId,
    setMessages,
    isManualToolInvocation,
    hideTitle,
    alwaysExpanded,
  }: ToolMessagePartProps) => {
    const t = useTranslations("");

    const { output, toolCallId, state, input, errorText } = part;

    const toolName = useMemo(() => getToolName(part), [part.type]);

    const isCompleted = useMemo(() => {
      return state.startsWith("output");
    }, [state]);

    const [expanded, setExpanded] = useState(false);
    const { copied: copiedInput, copy: copyInput } = useCopy();
    const { copied: copiedOutput, copy: copyOutput } = useCopy();
    const [isDeleting, setIsDeleting] = useState(false);

    // Handle keyboard shortcuts for approve/reject actions
    useEffect(() => {
      // Only enable shortcuts when manual tool invocation buttons are shown
      if (!isManualToolInvocation) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        const isApprove = isShortcutEvent(e, approveToolInvocationShortcut);
        const isReject = isShortcutEvent(e, rejectToolInvocationShortcut);

        if (!isApprove && !isReject) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (isApprove) {
          addToolResult?.({
            tool: toolName,
            toolCallId,
            output: ManualToolConfirmTag.create({ confirm: true }),
          });
        }

        if (isReject) {
          addToolResult?.({
            tool: toolName,
            toolCallId,
            output: ManualToolConfirmTag.create({ confirm: false }),
          });
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isManualToolInvocation, isLast]);

    const deleteMessage = useCallback(async () => {
      const ok = await notify.confirm({
        title: "Delete Message",
        description: "Are you sure you want to delete this message?",
      });
      if (!ok) return;
      safe(() => setIsDeleting(true))
        .ifOk(() => deleteMessageAction(messageId))
        .ifOk(() =>
          setMessages?.((messages) => {
            const index = messages.findIndex((m) => m.id === messageId);
            if (index !== -1) {
              return messages.filter((_, i) => i !== index);
            }
            return messages;
          }),
        )
        .ifFail((error) => toast.error(error.message))
        .watch(() => setIsDeleting(false))
        .unwrap();
    }, [messageId]);

    const onToolCallDirect = useCallback(
      (result: any) => {
        addToolResult?.({
          tool: toolName,
          toolCallId,
          output: result,
        });
      },
      [addToolResult, toolCallId],
    );

    const result = useMemo(() => {
      if (state == "output-error") {
        return errorText;
      }
      if (isCompleted) {
        return Array.isArray(output)
          ? {
              ...output,
              content: output.map((node) => {
                // mcp tools
                if (node?.type === "text" && typeof node?.text === "string") {
                  const parsed = safeJSONParse(node.text);
                  return {
                    ...node,
                    text: parsed.success ? parsed.value : node.text,
                  };
                }
                return node;
              }),
            }
          : output;
      }
      return null;
    }, [isCompleted, output, state, errorText]);

    const isWorkflowTool = useMemo(
      () => VercelAIWorkflowToolStreamingResultTag.isMaybe(result),
      [result],
    );

    const CustomToolComponent = useMemo(() => {
      if (
        toolName === DefaultToolName.WebSearch ||
        toolName === DefaultToolName.WebContent
      ) {
        return <WebSearchToolInvocation part={part} />;
      }

      if (toolName === DefaultToolName.JavascriptExecution) {
        return (
          <CodeExecutor
            part={part}
            key={part.toolCallId}
            onResult={onToolCallDirect}
            type="javascript"
          />
        );
      }

      if (toolName === DefaultToolName.PythonExecution) {
        return (
          <CodeExecutor
            part={part}
            key={part.toolCallId}
            onResult={onToolCallDirect}
            type="python"
          />
        );
      }

      if (state === "output-available") {
        switch (toolName) {
          case DefaultToolName.CreatePieChart:
            return (
              <PieChart key={`${toolCallId}-${toolName}`} {...(input as any)} />
            );
          case DefaultToolName.CreateBarChart:
            return (
              <BarChart key={`${toolCallId}-${toolName}`} {...(input as any)} />
            );
          case DefaultToolName.CreateLineChart:
            return (
              <LineChart
                key={`${toolCallId}-${toolName}`}
                {...(input as any)}
              />
            );
          case DefaultToolName.CreateTable:
            return (
              <InteractiveTable
                key={`${toolCallId}-${toolName}`}
                {...(input as any)}
              />
            );
        }
      }
      return null;
    }, [toolName, state, onToolCallDirect, result, input]);

    const { serverName: mcpServerName, toolName: mcpToolName } = useMemo(() => {
      return extractMCPToolId(toolName);
    }, [toolName]);

    const isExpanded = useMemo(() => {
      return !!alwaysExpanded || expanded || result === null || isWorkflowTool;
    }, [alwaysExpanded, expanded, result, isWorkflowTool]);

    const isExecuting = useMemo(() => {
      if (isWorkflowTool)
        return (
          (result as VercelAIWorkflowToolStreamingResult)?.status == "running"
        );
      return !isCompleted && isLast;
    }, [isWorkflowTool, isCompleted, result, isLast]);

    return (
      <div className="group w-full">
        {CustomToolComponent ? (
          CustomToolComponent
        ) : (
          <div className="flex flex-col fade-in duration-300 animate-in">
            {!hideTitle && (
              <div
                className="flex gap-2 items-center cursor-pointer group/title"
                onClick={() => {
                  if (!alwaysExpanded) setExpanded(!expanded);
                }}
              >
                <div className="p-1.5 text-primary bg-input/40 rounded">
                  {isExecuting ? (
                    <Loader className="size-3.5 animate-spin" />
                  ) : isError ? (
                    <TriangleAlert className="size-3.5 text-destructive" />
                  ) : isWorkflowTool ? (
                    <Avatar className="size-3.5">
                      <AvatarImage
                        src={
                          (result as VercelAIWorkflowToolStreamingResult)
                            .workflowIcon?.value
                        }
                      />
                      <AvatarFallback>
                        {toolName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <HammerIcon className="size-3.5" />
                  )}
                </div>
                <span className="font-bold flex items-center gap-2">
                  {isExecuting ? (
                    <TextShimmer>{mcpServerName}</TextShimmer>
                  ) : (
                    mcpServerName
                  )}
                </span>
                {mcpToolName && (
                  <>
                    <ChevronRight className="size-3.5" />
                    <span className="text-muted-foreground group-hover/title:text-primary transition-colors duration-300">
                      {mcpToolName}
                    </span>
                  </>
                )}
                <div className="ml-auto group-hover/title:bg-input p-1.5 rounded transition-colors duration-300">
                  <ChevronDownIcon
                    className={cn(isExpanded && "rotate-180", "size-3.5")}
                  />
                </div>
              </div>
            )}
            <div className="flex gap-2 py-2">
              <div className="w-7 flex justify-center">
                <Separator
                  orientation="vertical"
                  className="h-full bg-gradient-to-t from-transparent to-border to-5%"
                />
              </div>
              <div className="w-full flex flex-col gap-2">
                {isWorkflowTool ? (
                  <>
                    <div
                      className={cn(
                        "min-w-0 w-full p-4 rounded-lg bg-card px-4 border text-xs transition-colors fade-300",
                        !isExpanded && "hover:bg-secondary cursor-pointer",
                      )}
                      onClick={() => {
                        if (!isExpanded) {
                          setExpanded(true);
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <h5 className="text-muted-foreground font-medium select-none transition-colors">
                          Request
                        </h5>
                        <div className="flex-1" />
                        {copiedInput ? (
                          <Check className="size-3" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-3 text-muted-foreground"
                            onClick={() => copyInput(JSON.stringify(input))}
                          >
                            <Copy className="size-3" />
                          </Button>
                        )}
                      </div>
                      {isExpanded && (
                        <div className="p-2 max-h-[300px] overflow-y-auto ">
                          <JsonView data={input} />
                        </div>
                      )}
                    </div>
                    {!!result && (
                      <WorkflowInvocation
                        result={result as VercelAIWorkflowToolStreamingResult}
                      />
                    )}
                  </>
                ) : (
                  <div
                    className={cn(
                      "min-w-0 w-full p-4 rounded-lg bg-card px-4 border text-xs transition-colors fade-300",
                      !isExpanded && "hover:bg-secondary cursor-pointer",
                    )}
                    onClick={() => {
                      if (!isExpanded) {
                        setExpanded(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <h5 className="text-muted-foreground font-medium select-none"></h5>
                      <div className="flex-1" />
                      {copiedOutput ? (
                        <Check className="size-3" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-3 text-muted-foreground"
                          onClick={() =>
                            copyOutput(
                              JSON.stringify({
                                request: input,
                                response: result,
                              }),
                            )
                          }
                        >
                          <Copy className="size-3" />
                        </Button>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="p-2 max-h-[300px] overflow-y-auto flex flex-col gap-3">
                        <div>
                          <div className="text-muted-foreground font-medium mb-1">
                            Request
                          </div>
                          <JsonView data={input} />
                        </div>
                        {!!result && (
                          <div>
                            <div className="text-muted-foreground font-medium mb-1">
                              Response
                            </div>
                            <JsonView data={result} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {isManualToolInvocation && (
                  <div className="flex flex-row gap-2 items-center mt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full text-xs hover:ring py-2"
                      onClick={() =>
                        addToolResult?.({
                          tool: toolName,
                          toolCallId,
                          output: ManualToolConfirmTag.create({
                            confirm: true,
                          }),
                        })
                      }
                    >
                      <Check />
                      {t("Common.approve")}
                      <Separator orientation="vertical" className="h-4" />
                      <span className="text-muted-foreground">
                        {getShortcutKeyList(approveToolInvocationShortcut).join(
                          " ",
                        )}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs py-2"
                      onClick={() =>
                        addToolResult?.({
                          tool: toolName,
                          toolCallId,
                          output: ManualToolConfirmTag.create({
                            confirm: false,
                          }),
                        })
                      }
                    >
                      <X />
                      {t("Common.reject")}
                      <Separator orientation="vertical" />
                      <span className="text-muted-foreground">
                        {getShortcutKeyList(rejectToolInvocationShortcut).join(
                          " ",
                        )}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {showActions && (
              <div className="flex flex-row gap-2 items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      disabled={isDeleting}
                      onClick={deleteMessage}
                      variant="ghost"
                      size="icon"
                      className="size-3! p-4! opacity-0 group-hover/message:opacity-100 hover:text-destructive"
                    >
                      {isDeleting ? (
                        <Loader className="animate-spin" />
                      ) : (
                        <Trash2 />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-destructive" side="bottom">
                    Delete Message
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
  (prev, next) => {
    if (prev.isError !== next.isError) return false;
    if (prev.isLast !== next.isLast) return false;
    if (prev.showActions !== next.showActions) return false;
    if (prev.isManualToolInvocation !== next.isManualToolInvocation)
      return false;
    if (prev.messageId !== next.messageId) return false;
    if (!equal(prev.part, next.part)) return false;
    return true;
  },
);

ToolMessagePart.displayName = "ToolMessagePart";
