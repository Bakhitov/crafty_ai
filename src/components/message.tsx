"use client";

import { getToolName, isToolUIPart, type ToolUIPart, type UIMessage } from "ai";
import { memo, useMemo, useState, useCallback } from "react";
import equal from "lib/equal";

import { cn, truncateString } from "lib/utils";
import type { UseChatHelpers } from "@ai-sdk/react";
import {
  UserMessagePart,
  AssistMessagePart,
  ToolMessagePart,
  ReasoningPart,
} from "./message-parts";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  TriangleAlertIcon,
  Hammer as HammerIcon,
} from "lucide-react";
import { Button } from "ui/button";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { extractMCPToolId } from "lib/ai/mcp/mcp-tool-id";

interface Props {
  message: UIMessage;
  prevMessage: UIMessage;
  threadId?: string;
  isLoading: boolean;
  isLastMessage: boolean;
  setMessages: UseChatHelpers<UIMessage>["setMessages"];
  sendMessage: UseChatHelpers<UIMessage>["sendMessage"];
  className?: string;
  addToolResult?: UseChatHelpers<UIMessage>["addToolResult"];
  messageIndex: number;
  status: UseChatHelpers<UIMessage>["status"];
}

const PurePreviewMessage = ({
  message,
  prevMessage,
  threadId,
  isLoading,
  isLastMessage,
  status,
  className,
  setMessages,
  addToolResult,
  messageIndex,
  sendMessage,
}: Props) => {
  const isUserMessage = useMemo(() => message.role === "user", [message.role]);
  const groupedToolStartIndexes = useMemo(() => {
    const starts = new Set<number>();
    for (let i = 0; i < message.parts.length; i++) {
      const part = message.parts[i];
      if (!isToolUIPart(part)) continue;
      const toolName = getToolName(part as ToolUIPart);
      const { serverName } = extractMCPToolId(toolName);
      const prev = i > 0 ? message.parts[i - 1] : undefined;
      if (!prev || !isToolUIPart(prev)) {
        starts.add(i);
        continue;
      }
      const prevToolName = getToolName(prev as ToolUIPart);
      const { serverName: prevServer } = extractMCPToolId(prevToolName);
      if (prevServer !== serverName) starts.add(i);
    }
    return starts;
  }, [message.parts]);

  const getMcpGroupForIndex = useCallback(
    (startIndex: number) => {
      const startPart = message.parts[startIndex];
      if (!isToolUIPart(startPart)) return undefined;
      const toolName = getToolName(startPart as ToolUIPart);
      const { serverName } = extractMCPToolId(toolName);
      const parts: ToolUIPart[] = [] as any;
      let endIndex = startIndex;
      for (let i = startIndex; i < message.parts.length; i++) {
        const p = message.parts[i];
        if (!isToolUIPart(p)) break;
        const tn = getToolName(p as ToolUIPart);
        const { serverName: s } = extractMCPToolId(tn);
        if (s !== serverName) break;
        parts.push(p as ToolUIPart);
        endIndex = i;
      }
      return { serverName, parts, endIndex };
    },
    [message.parts],
  );

  const McpToolGroup = ({
    serverName,
    parts,
    startIndex,
  }: {
    serverName: string;
    parts: ToolUIPart[];
    startIndex: number;
  }) => {
    const [expanded, setExpanded] = useState(false);
    const [stepExpanded, setStepExpanded] = useState<Record<number, boolean>>(
      {},
    );

    const toolNameList = useMemo(() => {
      const list: string[] = [];
      for (const p of parts) {
        const tn = getToolName(p);
        const { toolName: tool } = extractMCPToolId(tn);
        if (tool) list.push(tool);
      }
      return list.join(", ");
    }, [parts]);

    const toggleStep = (idx: number) => {
      setStepExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));
    };

    const summarizeValue = (v: any): string => {
      if (v === null || v === undefined) return String(v);
      if (typeof v === "string") return JSON.stringify(v);
      if (typeof v === "number" || typeof v === "boolean") return String(v);
      if (Array.isArray(v)) return `[${v.map(summarizeValue).join(", ")}]`;
      if (typeof v === "object") {
        return Object.entries(v)
          .map(([k, val]) => `${k}:${summarizeValue(val as any)}`)
          .join(", ");
      }
      try {
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    };

    const summarizeInput = (input: any): string => {
      if (input && typeof input === "object" && !Array.isArray(input)) {
        return Object.entries(input)
          .map(([k, val]) => `${k}:${summarizeValue(val as any)}`)
          .join(", ");
      }
      return summarizeValue(input);
    };

    return (
      <div className="flex flex-col gap-2">
        <div
          className="flex gap-2 items-center cursor-pointer group/title"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="p-1.5 text-primary bg-input/40 rounded">
            <HammerIcon className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold flex items-center gap-2">
            {serverName}
          </span>
          {toolNameList && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{toolNameList}</span>
            </>
          )}
          <div className="ml-auto group-hover/title:bg-input p-1.5 rounded transition-colors duration-300">
            <ChevronDown
              className={cn(expanded && "rotate-180", "h-3.5 w-3.5")}
            />
          </div>
        </div>
        {expanded && (
          <div className="flex flex-col gap-2">
            {parts.map((p, offset) => {
              const globalIndex = startIndex + offset;
              const isLastPart = globalIndex === message.parts.length - 1;
              const tn = getToolName(p);
              const { toolName: tool } = extractMCPToolId(tn);
              const stepOpen = !!stepExpanded[globalIndex];
              return (
                <div
                  key={`message-${messageIndex}-mcp-group-${serverName}-${globalIndex}`}
                  className="flex flex-col gap-2"
                >
                  <div
                    className="flex gap-2 items-center cursor-pointer group/title"
                    onClick={() => toggleStep(globalIndex)}
                  >
                    <div className="p-1.5 bg-input/40 rounded">
                      <ChevronDown
                        className={cn(stepOpen && "rotate-180", "h-3.5 w-3.5")}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {offset + 1} step - {tool || tn}
                    </span>
                    <div className="text-xs text-muted-foreground ml-2 flex-1 min-w-0 flex gap-1">
                      <span className="shrink-0">Request -</span>
                      <span className="whitespace-pre-wrap break-words">
                        {summarizeInput((p as any).input)}
                      </span>
                    </div>
                  </div>
                  {stepOpen && (
                    <ToolMessagePart
                      isLast={isLastMessage && isLastPart}
                      messageId={message.id}
                      showActions={
                        isLastMessage ? isLastPart && !isLoading : isLastPart
                      }
                      addToolResult={addToolResult}
                      part={p}
                      setMessages={setMessages}
                      hideTitle
                      alwaysExpanded
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Early returns (after hooks to satisfy rules-of-hooks)
  if (message.role == "system") {
    return null; // system message is not shown
  }
  if (!message.parts.length) return null;

  return (
    <div className="w-full mx-auto max-w-3xl px-6 group/message">
      <div
        className={cn(
          "flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
          className,
        )}
      >
        <div className="flex flex-col gap-4 w-full">
          {message.parts?.map((part, index) => {
            const key = `message-${messageIndex}-part-${part.type}-${index}`;
            const isLastPart = index === message.parts.length - 1;

            if (part.type === "reasoning") {
              return (
                <ReasoningPart
                  key={key}
                  reasoningText={part.text}
                  isThinking={isLastPart && isLastMessage && isLoading}
                />
              );
            }

            if (isUserMessage && part.type === "text" && part.text) {
              return (
                <UserMessagePart
                  key={key}
                  status={status}
                  part={part}
                  isLast={isLastPart}
                  message={message}
                  setMessages={setMessages}
                  sendMessage={sendMessage}
                />
              );
            }

            if (part.type === "text" && !isUserMessage) {
              return (
                <AssistMessagePart
                  threadId={threadId}
                  isLast={isLastMessage && isLastPart}
                  isLoading={isLoading}
                  key={key}
                  part={part}
                  prevMessage={prevMessage}
                  showActions={
                    isLastMessage ? isLastPart && !isLoading : isLastPart
                  }
                  message={message}
                  setMessages={setMessages}
                  sendMessage={sendMessage}
                />
              );
            }

            // Render assistant file/image parts
            if (!isUserMessage && part.type === "file") {
              const mediaType = (part as any).mediaType as string | undefined;
              const base64 = (part as any).base64 as string | undefined;
              if (mediaType?.startsWith("image/") && base64) {
                const src = base64.startsWith("data:")
                  ? base64
                  : `data:${mediaType};base64,${base64}`;
                return (
                  <div key={key} className="rounded-lg overflow-hidden border">
                    <Image
                      src={src}
                      alt={mediaType}
                      width={1024}
                      height={1024}
                      unoptimized
                      className="max-w-full h-auto"
                    />
                  </div>
                );
              }
              return null;
            }

            if (isToolUIPart(part)) {
              const toolName = getToolName(part as ToolUIPart);
              const { serverName } = extractMCPToolId(toolName);
              const isGroupStart = groupedToolStartIndexes.has(index);
              if (isGroupStart) {
                const group = getMcpGroupForIndex(index);
                if (group) {
                  return (
                    <McpToolGroup
                      key={`message-${messageIndex}-mcp-group-${serverName}-${index}`}
                      serverName={group.serverName}
                      parts={group.parts}
                      startIndex={index}
                    />
                  );
                }
              }
              // Non-start tool parts that belong to the current MCP group are skipped here,
              // because they will be rendered inside the group component.
              return null;
            } else if (part.type === "step-start") {
              return null;
            } else {
              return <div key={key}> unknown part {part.type}</div>;
            }
          })}
        </div>
      </div>
    </div>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  function equalMessage(prevProps: Props, nextProps: Props) {
    if (prevProps.message.id !== nextProps.message.id) return false;

    if (prevProps.isLoading !== nextProps.isLoading) return false;

    if (prevProps.isLastMessage !== nextProps.isLastMessage) return false;

    if (prevProps.className !== nextProps.className) return false;

    if (nextProps.isLoading && nextProps.isLastMessage) return false;

    if (!equal(prevProps.message.metadata, nextProps.message.metadata))
      return false;

    if (prevProps.message.parts.length !== nextProps.message.parts.length) {
      return false;
    }
    if (!equal(prevProps.message.parts, nextProps.message.parts)) {
      return false;
    }

    return true;
  },
);

export const ErrorMessage = ({
  error,
}: {
  error: Error;
  message?: UIMessage;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 200;
  const t = useTranslations();
  return (
    <div className="w-full mx-auto max-w-3xl px-6 animate-in fade-in mt-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-4 px-2 opacity-70">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-muted rounded-sm">
              <TriangleAlertIcon className="h-3.5 w-3.5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm mb-2">{t("Chat.Error")}</p>
              <div className="text-sm text-muted-foreground">
                <div className="whitespace-pre-wrap">
                  {isExpanded
                    ? error.message
                    : truncateString(error.message, maxLength)}
                </div>
                {error.message.length > maxLength && (
                  <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    variant={"ghost"}
                    className="h-auto p-1 text-xs mt-2"
                    size={"sm"}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        {t("Common.showLess")}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        {t("Common.showMore")}
                      </>
                    )}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground mt-3 italic">
                  {t("Chat.thisMessageWasNotSavedPleaseTryTheChatAgain")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
