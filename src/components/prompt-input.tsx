"use client";

import {
  AudioWaveformIcon,
  ChevronDown,
  CornerRightUp,
  PlusIcon,
  Square,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "ui/button";
import { cn } from "lib/utils";
import { UIMessage, UseChatHelpers } from "@ai-sdk/react";
import { SelectModel } from "./select-model";
import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import { ChatMention, ChatModel } from "app-types/chat";
import dynamic from "next/dynamic";
import { ToolModeDropdown } from "./tool-mode-dropdown";
import { RiImageCircleAiFill } from "react-icons/ri";
import {
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Archive,
  Code,
} from "lucide-react";

import { ToolSelectDropdown } from "./tool-select-dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { useTranslations } from "next-intl";
import { Editor } from "@tiptap/react";
import { WorkflowSummary } from "app-types/workflow";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import equal from "lib/equal";
import { MCPIcon } from "ui/mcp-icon";
import { DefaultToolName } from "lib/ai/tools";
import { DefaultToolIcon } from "./default-tool-icon";
import { OpenAIIcon } from "ui/openai-icon";
import { GrokIcon } from "ui/grok-icon";
import { ClaudeIcon } from "ui/claude-icon";
import { GeminiIcon } from "ui/gemini-icon";
import { ImageSettingsPanel } from "./image-settings-panel";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

import { EMOJI_DATA } from "lib/const";
import { AgentSummary } from "app-types/agent";

interface PromptInputProps {
  placeholder?: string;
  setInput: (value: string) => void;
  input: string;
  onStop: () => void;
  sendMessage: UseChatHelpers<UIMessage>["sendMessage"];
  toolDisabled?: boolean;
  isLoading?: boolean;
  model?: ChatModel;
  setModel?: (model: ChatModel) => void;
  voiceDisabled?: boolean;
  threadId?: string;
  disabledMention?: boolean;
  onFocus?: () => void;
}

const ChatMentionInput = dynamic(() => import("./chat-mention-input"), {
  ssr: false,
  loading() {
    return <div className="h-[2rem] w-full animate-pulse"></div>;
  },
});

export default function PromptInput({
  placeholder,
  sendMessage,
  model,
  setModel,
  input,
  onFocus,
  setInput,
  onStop,
  isLoading,
  toolDisabled,
  voiceDisabled,
  threadId,
  disabledMention,
}: PromptInputProps) {
  const t = useTranslations("Chat");

  const [globalModel, threadMentions, appStoreMutate] = appStore(
    useShallow((state) => [
      state.chatModel,
      state.threadMentions,
      state.mutate,
    ]),
  );

  const mentions = useMemo<ChatMention[]>(() => {
    if (!threadId) return [];
    return threadMentions[threadId!] ?? [];
  }, [threadMentions, threadId]);

  const chatModel = useMemo(() => {
    return model ?? globalModel;
  }, [model, globalModel]);

  

  // Image generation settings (shown only when current model supports images)
  const [imageSize, setImageSize] = useState<string>("1024x1024");
  const [imageStyle, setImageStyle] = useState<string>("vivid");
  const [imageQuality, setImageQuality] = useState<string>("high");
  const [aspectRatio, setAspectRatio] = useState<string>("");
  const [providerOptionsText, setProviderOptionsText] = useState<string>("");
  const [imageEngine, setImageEngine] = useState<string>("auto");
  const [imageModel, setImageModel] = useState<string>("");
  const [imageEnabled, setImageEnabled] = useState<boolean>(false);

  // Hashtag suggestions state
  const hashtagPresets = useMemo(
    () => [
      "Product Showcase",
      "Fashion",
      "Food & Beverage",
      "Tech Service",
      "Real Estate",
    ],
    [],
  );
  const hashtagPresetMap = useMemo(
    () => ({
      "Product Showcase":
        "A sleek smartphone floating in space with dynamic light rays, minimalist background, product advertisement",
      Fashion:
        "A stylish leather jacket on an invisible mannequin against a gradient background, high-end fashion advertisement",
      "Food & Beverage":
        "A refreshing iced coffee in a transparent glass with condensation, soft natural lighting, on a wooden table",
      "Tech Service":
        "Abstract digital network connections forming a human profile, blue gradient background, tech service advertisement",
      "Real Estate":
        "A modern minimalist living room with floor-to-ceiling windows, natural light, architectural advertisement",
    }),
    [],
  );
  const [showHashBar, setShowHashBar] = useState(false);
  const [hashQuery, setHashQuery] = useState("");

  const onInputChanged = useCallback(
    (text: string) => {
      setInput(text);
      const m = text.match(/#([\p{L}\p{N} _-]*)$/u);
      if (m) {
        setShowHashBar(true);
        setHashQuery((m[1] || "").trim());
      } else {
        setShowHashBar(false);
        setHashQuery("");
      }
    },
    [setInput],
  );

  const filteredHashtagPresets = useMemo(() => {
    if (!hashQuery) return hashtagPresets;
    const q = hashQuery.toLowerCase();
    return hashtagPresets.filter((t) => t.toLowerCase().includes(q));
  }, [hashtagPresets, hashQuery]);

  const bestHashtagSuggestion = useMemo(() => {
    return filteredHashtagPresets[0] || undefined;
  }, [filteredHashtagPresets]);

  const replaceHashWithPreset = useCallback(
    (title: string) => {
      const text = hashtagPresetMap[title] || title;
      const r = /#([\p{L}\p{N} _-]*)$/u;
      const base = input || "";
      const next = r.test(base) ? base.replace(r, text) : `${base} ${text}`;
      setInput(next.trim());
      setShowHashBar(false);
      setHashQuery("");
      editorRef.current?.commands.focus();
    },
    [hashtagPresetMap, input, setInput],
  );

  useEffect(() => {
    if (!showHashBar || !bestHashtagSuggestion) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" || e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        replaceHashWithPreset(bestHashtagSuggestion);
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
  }, [showHashBar, bestHashtagSuggestion, replaceHashWithPreset]);

  const sizeOptionsByModel: Record<string, { label: string; value: string }[]> = {
    "dall-e-3": [
      { label: "1:1 (1024x1024)", value: "1024x1024" },
      { label: "16:9 (1792x1024)", value: "1792x1024" },
      { label: "9:16 (1024x1792)", value: "1024x1792" },
    ],
    "gpt-image-1": [
      { label: "1:1 (1024x1024)", value: "1024x1024" },
      { label: "3:2 (1536x1024)", value: "1536x1024" },
      { label: "2:3 (1024x1536)", value: "1024x1536" },
    ],
  };

  useEffect(() => {
    if (!chatModel) return;
    const sizes = sizeOptionsByModel[chatModel.model]?.map((s) => s.value) || [];
    if (sizes.length > 0 && !sizes.includes(imageSize)) {
      setImageSize(sizes[0]);
    }
  }, [chatModel?.model]);

  const editorRef = useRef<Editor | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const setChatModel = useCallback(
    (model: ChatModel) => {
      if (setModel) {
        setModel(model);
      } else {
        appStoreMutate({ chatModel: model });
      }
    },
    [setModel, appStoreMutate],
  );

  const deleteMention = useCallback(
    (mention: ChatMention) => {
      if (!threadId) return;
      appStoreMutate((prev) => {
        const newMentions = mentions.filter((m) => !equal(m, mention));
        return {
          threadMentions: {
            ...prev.threadMentions,
            [threadId!]: newMentions,
          },
        };
      });
    },
    [mentions, appStoreMutate, threadId],
  );

  const addMention = useCallback(
    (mention: ChatMention) => {
      if (!threadId) return;
      appStoreMutate((prev) => {
        if (mentions.some((m) => equal(m, mention))) return prev;

        const newMentions =
          mention.type == "agent"
            ? [...mentions.filter((m) => m.type !== "agent"), mention]
            : [...mentions, mention];

        return {
          threadMentions: {
            ...prev.threadMentions,
            [threadId!]: newMentions,
          },
        };
      });
    },
    [mentions, threadId],
  );

  const onSelectWorkflow = useCallback(
    (workflow: WorkflowSummary) => {
      addMention({
        type: "workflow",
        name: workflow.name,
        icon: workflow.icon,
        workflowId: workflow.id,
        description: workflow.description,
      });
    },
    [addMention],
  );

  const onSelectAgent = useCallback(
    (agent: AgentSummary) => {
      appStoreMutate((prev) => {
        return {
          threadMentions: {
            ...prev.threadMentions,
            [threadId!]: [
              {
                type: "agent",
                name: agent.name,
                icon: agent.icon,
                description: agent.description,
                agentId: agent.id,
              },
            ],
          },
        };
      });
    },
    [mentions, threadId],
  );

  const onChangeMention = useCallback(
    (mentions: ChatMention[]) => {
      let hasAgent = false;
      [...mentions]
        .reverse()
        .filter((m) => {
          if (m.type == "agent") {
            if (hasAgent) return false;
            hasAgent = true;
          }

          return true;
        })
        .reverse()
        .forEach(addMention);
    },
    [addMention],
  );

  const toDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const renderFileIcon = (file: File) => {
    const mime = (file.type || "").toLowerCase();
    if (mime.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (mime.startsWith("audio/")) return <Music className="h-4 w-4" />;
    if (mime.startsWith("video/")) return <Video className="h-4 w-4" />;
    if (
      mime === "application/pdf" ||
      mime.startsWith("text/") ||
      mime.includes("msword") ||
      mime.includes("officedocument")
    )
      return <FileText className="h-4 w-4" />;
    if (
      mime.includes("zip") ||
      mime.includes("x-7z") ||
      mime.includes("x-rar") ||
      mime.includes("x-tar")
    )
      return <Archive className="h-4 w-4" />;
    if (
      mime.includes("javascript") ||
      mime.includes("json") ||
      mime.includes("typescript") ||
      mime.includes("xml") ||
      mime.includes("csv")
    )
      return <Code className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const submit = async () => {
    if (isLoading) return;
    // Автоконвертация #label -> full prompt перед отправкой
    let processed = input || "";
    try {
      const r = /#([\p{L}\p{N} _-]*)$/u;
      const m = r.exec(processed);
      if (m) {
        const typed = (m[1] || "").trim();
        if (typed.length) {
          const matchedTitle = hashtagPresets.find(
            (t) => t.toLowerCase() === typed.toLowerCase(),
          );
          if (matchedTitle) {
            const fullPrompt = hashtagPresetMap[matchedTitle] || matchedTitle;
            processed = processed.replace(r, fullPrompt);
          }
        }
      }
    } catch {}
    const userMessage = processed.trim() || "";
    if (userMessage.length === 0 && files.length === 0) return;
    const fileParts = await Promise.all(
      files.map(async (f) => {
        const url = await toDataUrl(f);
        return {
          type: "file",
          filename: f.name,
          mediaType: f.type || "application/octet-stream",
          url,
        } as any;
      }),
    );

    setInput("");
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const parts: any[] = [];
    if (userMessage.length > 0) {
      parts.push({ type: "text", text: userMessage });
    }
    parts.push(...fileParts);

    if (imageEnabled) {
      let providerOptions: any = undefined;
      try {
        providerOptions = providerOptionsText.trim()
          ? JSON.parse(providerOptionsText)
          : undefined;
      } catch {}

      sendMessage(
        { role: "user", parts },
        {
          body: {
            imageSettings: {
              enabled: true,
              engine: imageEngine,
              imageModel: imageModel || undefined,
              size: imageSize,
              style: imageStyle,
              quality: imageQuality,
              aspectRatio: aspectRatio || undefined,
              providerOptions,
            },
          },
        },
      );
      return;
    }

    sendMessage({ role: "user", parts });
  };

  // Handle ESC key to clear mentions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mentions.length > 0 && threadId) {
        e.preventDefault();
        e.stopPropagation();
        appStoreMutate((prev) => ({
          threadMentions: {
            ...prev.threadMentions,
            [threadId]: [],
          },
          agentId: undefined,
        }));
        editorRef.current?.commands.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mentions.length, threadId, appStoreMutate]);

  useEffect(() => {
    if (!editorRef.current) return;
  }, [editorRef.current]);

  return (
    <div className="max-w-3xl mx-auto fade-in animate-in">
      <div className="z-10 mx-auto w-full max-w-3xl relative">
        <fieldset className="flex w-full min-w-0 max-w-full flex-col px-4">
          <div className="shadow-lg overflow-hidden rounded-4xl backdrop-blur-sm transition-all duration-200 bg-muted/60 relative flex w-full flex-col cursor-text z-10 items-stretch focus-within:bg-muted hover:bg-muted focus-within:ring-muted hover:ring-muted">
            {mentions.length > 0 && (
              <div className="bg-input rounded-b-sm rounded-t-3xl p-3 flex flex-col gap-4 mx-2 my-2">
                {mentions.map((mention, i) => {
                  return (
                    <div key={i} className="flex items-center gap-2">
                      {mention.type === "workflow" ||
                      mention.type === "agent" ? (
                        <Avatar
                          className="size-6 p-1 ring ring-border rounded-full flex-shrink-0"
                          style={mention.icon?.style}
                        >
                          <AvatarImage
                            src={
                              mention.icon?.value ||
                              EMOJI_DATA[i % EMOJI_DATA.length]
                            }
                          />
                          <AvatarFallback>
                            {mention.name.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Button className="size-6 flex items-center justify-center ring ring-border rounded-full flex-shrink-0 p-0.5">
                          {mention.type == "mcpServer" ? (
                            <MCPIcon className="size-3.5" />
                          ) : (
                            <DefaultToolIcon
                              name={mention.name as DefaultToolName}
                              className="size-3.5"
                            />
                          )}
                        </Button>
                      )}

                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-semibold truncate">
                          {mention.name}
                        </span>
                        {mention.description ? (
                          <span className="text-muted-foreground text-xs truncate">
                            {mention.description}
                          </span>
                        ) : null}
                      </div>
                      <Button
                        variant={"ghost"}
                        size={"icon"}
                        disabled={!threadId}
                        className="rounded-full hover:bg-input! flex-shrink-0"
                        onClick={() => {
                          deleteMention(mention);
                        }}
                      >
                        <XIcon />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex flex-col gap-3.5 px-5 pt-2 pb-4">
              <div className="relative min-h-[2rem]">
                <ChatMentionInput
                  input={input}
                  onChange={onInputChanged}
                  onChangeMention={onChangeMention}
                  onEnter={submit}
                  placeholder={placeholder ?? t("placeholder")}
                  ref={editorRef}
                  disabledMention={disabledMention}
                  onFocus={onFocus}
                />
              </div>
              {showHashBar && (
                <div className="px-1 -mt-1">
                  <ScrollArea className="w-full whitespace-nowrap rounded-md">
                    <div className="flex w-max space-x-2 py-1 items-center">
                      <span className="text-xs text-muted-foreground"> </span>
                      {filteredHashtagPresets.map((title) => (
                        <button
                          key={title}
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => replaceHashWithPreset(title)}
                        >
                          #{title}
                        </button>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              )}
              {/* удалён дублирующий блок старых промптов под полем */}

              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 px-1">
                  {files.map((file, idx) => {
                    const isImage = (file.type || "").startsWith("image/");
                    const previewUrl = isImage
                      ? URL.createObjectURL(file)
                      : undefined;
                    return (
                      <div
                        key={`${file.name}-${idx}`}
                        className="flex items-center gap-2 rounded-md border bg-input/50 px-2 py-1"
                      >
                        {isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt={file.name}
                            className="h-10 w-10 rounded object-cover"
                            onLoad={() => {
                              if (previewUrl) URL.revokeObjectURL(previewUrl);
                            }}
                          />
                        ) : (
                          <div className="p-1 bg-background/60 rounded text-muted-foreground">
                            {renderFileIcon(file)}
                          </div>
                        )}
                        <span className="text-xs truncate max-w-[160px]">
                          {file.name}
                        </span>
                        <Button
                          variant={"ghost"}
                          size={"icon"}
                          className="rounded-full hover:bg-input! flex-shrink-0 h-6 w-6 p-0"
                          onClick={() => {
                            setFiles((prev) =>
                              prev.filter((_, i) => i !== idx),
                            );
                          }}
                          aria-label={`remove ${file.name}`}
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex w-full items-center z-30">
                <Button
                  variant={"ghost"}
                  size={"sm"}
                  className="rounded-full hover:bg-input! p-2!"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PlusIcon />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files && event.target.files.length > 0) {
                      setFiles((prev) => [
                        ...prev,
                        ...Array.from(event.target.files || []),
                      ]);
                    }
                  }}
                />

                {!toolDisabled && (
                  <>
                    <ToolModeDropdown />
                    <ToolSelectDropdown
                      className="mx-1"
                      align="start"
                      side="top"
                      onSelectWorkflow={onSelectWorkflow}
                      onSelectAgent={onSelectAgent}
                      mentions={mentions}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="rounded-full text-sm text-primary font-semibold ml-1"
                      onClick={() => {
                        setShowHashBar((v) => !v);
                        setHashQuery("");
                        editorRef.current?.commands.focus();
                      }}
                    >
                      #prompts
                    </Button>
                  </>
                )}

                <div className="flex-1" />

                {/* порядок: Image Toggle -> Image Settings -> SelectModel */}
                {/* 1) Image ON/OFF */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={imageEnabled ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "rounded-full p-2! mr-1",
                        imageEnabled
                          ? "bg-primary text-primary-foreground ring-2 ring-primary hover:bg-primary!"
                          : "bg-transparent text-muted-foreground hover:bg-input!",
                      )}
                      aria-pressed={imageEnabled}
                      onClick={() => setImageEnabled((v) => !v)}
                    >
                      <RiImageCircleAiFill
                        className={cn(
                          "size-3",
                          imageEnabled ? "text-primary-foreground" : "text-muted-foreground",
                        )}
                      />
                      <span className={cn("ml-1 text-xs", imageEnabled ? "text-primary-foreground" : "text-muted-foreground")}>Image</span>
                    </Button>
                  </TooltipTrigger>
                  {imageEnabled && (
                    <TooltipContent>
                      Генерация картинок — включена
                    </TooltipContent>
                  )}
                </Tooltip>
                {/* 2) Image Settings */}
                {imageEnabled && (
                  <ImageSettingsPanel
                    chatModel={chatModel || null}
                    engine={imageEngine}
                    setEngine={setImageEngine}
                    size={imageSize}
                    setSize={setImageSize}
                    style={imageStyle}
                    setStyle={setImageStyle}
                    quality={imageQuality}
                    setQuality={setImageQuality}
                    aspectRatio={aspectRatio}
                    setAspectRatio={setAspectRatio}
                    providerOptionsText={providerOptionsText}
                    setProviderOptionsText={setProviderOptionsText}
                    imageModel={imageModel}
                    setImageModel={setImageModel}
                  />
                )}
                {/* 3) SelectModel */}
                <SelectModel onSelect={setChatModel} currentModel={chatModel}>
                  <Button
                    variant={"ghost"}
                    size={"sm"}
                    className="rounded-full group data-[state=open]:bg-input! hover:bg-input! mr-1 min-w-[130px]"
                    data-testid="model-selector-button"
                  >
                    {chatModel?.model ? (
                      <>
                        {chatModel.provider === "openai" ? (
                          <OpenAIIcon className="size-3 opacity-0 group-data-[state=open]:opacity-100 group-hover:opacity-100" />
                        ) : chatModel.provider === "xai" ? (
                          <GrokIcon className="size-3 opacity-0 group-data-[state=open]:opacity-100 group-hover:opacity-100" />
                        ) : chatModel.provider === "anthropic" ? (
                          <ClaudeIcon className="size-3 opacity-0 group-data-[state=open]:opacity-100 group-hover:opacity-100" />
                        ) : chatModel.provider === "google" ? (
                          <GeminiIcon className="size-3 opacity-0 group-data-[state=open]:opacity-100 group-hover:opacity-100" />
                        ) : null}
                        <span
                          className="text-foreground group-data-[state=open]:text-foreground  "
                          data-testid="selected-model-name"
                        >
                          {chatModel.model}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">model</span>
                    )}

                    <ChevronDown className="size-3" />
                  </Button>
                </SelectModel>
                {!isLoading && !input.length && !voiceDisabled ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size={"sm"}
                        onClick={() => {
                          appStoreMutate((state) => ({
                            voiceChat: {
                              ...state.voiceChat,
                              isOpen: true,
                              agentId: undefined,
                            },
                          }));
                        }}
                        className="rounded-full p-2!"
                      >
                        <AudioWaveformIcon size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("VoiceChat.title")}</TooltipContent>
                  </Tooltip>
                ) : (
                  <div
                    onClick={() => {
                      if (isLoading) {
                        onStop();
                      } else {
                        submit();
                      }
                    }}
                    className="fade-in animate-in cursor-pointer text-muted-foreground rounded-full p-2 bg-secondary hover:bg-accent-foreground hover:text-accent transition-all duration-200"
                  >
                    {isLoading ? (
                      <Square
                        size={16}
                        className="fill-muted-foreground text-muted-foreground"
                      />
                    ) : (
                      <CornerRightUp size={16} />
                    )}
                  </div>
                )}
              </div>
              {/* удалён нижний список подсказок для image-моделей */}
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
