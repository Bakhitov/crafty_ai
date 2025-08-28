"use client";
import { useObjectState } from "@/hooks/use-object-state";
import { UserPreferences } from "app-types/user";
import { authClient } from "auth/client";
import { fetcher } from "lib/utils";
import { AlertCircle, ArrowLeft, Loader } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { safe } from "ts-safe";

import { Button } from "ui/button";
import { ExamplePlaceholder } from "ui/example-placeholder";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Skeleton } from "ui/skeleton";
import { Textarea } from "ui/textarea";
import { McpServerCustomizationContent } from "./mcp-customization-popup";
import { MCPServerInfo } from "app-types/mcp";
import { useMcpList } from "@/hooks/queries/use-mcp-list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { Card } from "ui/card";
import { ModelProviderIcon } from "ui/model-provider-icon";
import { GoTrash } from "react-icons/go";

type ProviderKey =
  | "openai"
  | "google"
  | "anthropic"
  | "xai"
  | "openrouter"
  | "exa";

const PROVIDERS: { id: ProviderKey; name: string }[] = [
  { id: "openai", name: "OpenAI" },
  { id: "google", name: "Google" },
  { id: "anthropic", name: "Anthropic" },
  { id: "xai", name: "XAI" },
  { id: "openrouter", name: "OpenRouter" },
  { id: "exa", name: "Exa" },
];

export function ApiKeysContent() {
  const t = useTranslations();
  const [provider, setProvider] = useState<ProviderKey | "">("");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, mutate, isLoading } = useSWR<Record<string, any>>(
    "/api/user/keys",
    fetcher,
  );

  const onSave = async () => {
    setIsSubmitting(true);
    try {
      const body: any = { provider, key: apiKey };
      if (label) body.label = label;
      if (baseUrl) body.baseUrl = baseUrl;
      const res = await fetch("/api/user/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(t("Common.saved"));
      setApiKey("");
      await mutate();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async (prov: string, lbl?: string | null) => {
    try {
      const res = await fetch("/api/user/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: prov, label: lbl ?? null }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(t("Common.deleted"));
      await mutate();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  return (
    <div className="flex flex-col">
      <h3 className="text-xl font-semibold">
        {t("Chat.ChatPreferences.apiKeys")}
      </h3>
      <p className="text-sm text-muted-foreground py-2 pb-6">
        {t("Chat.ChatPreferences.apiKeysDescription")}
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>{t("Common.provider")}</Label>
              <Select
                value={provider}
                onValueChange={(v) => setProvider(v as ProviderKey)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Common.select")} />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <ModelProviderIcon provider={p.id} className="size-3" />
                        <span>{p.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("Common.label")}</Label>
              <Input
                placeholder="default"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>API Key</Label>
              <Input
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Base URL</Label>
              <Input
                placeholder="https://api.openai.com/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("Chat.ChatPreferences.baseUrlHint")}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={onSave}
                disabled={!provider || !apiKey || isSubmitting}
              >
                {t("Common.save")}
                {isSubmitting && (
                  <Loader className="size-4 ml-2 animate-spin" />
                )}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <Label>{t("Chat.ChatPreferences.existingKeys")}</Label>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : !data || Object.keys(data || {}).length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("Chat.ChatPreferences.noKeys")}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {Object.entries(data).map(([prov, list]) => (
                  <div key={prov} className="border rounded-lg p-3">
                    <div className="font-medium mb-2 flex items-center gap-2">
                      <ModelProviderIcon provider={prov} className="size-3" />
                      <span>{prov}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {(list as any[]).map((k, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span>{k.label || "default"}</span>
                              <span className="text-muted-foreground">
                                {k.baseUrl || "default endpoint"}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => onDelete(prov, k.label || null)}
                              aria-label={t("Common.delete")}
                            >
                              <span className="sr-only">
                                {t("Common.delete")}
                              </span>
                              <GoTrash className="size-4 text-red-700 dark:text-red-400" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function UserInstructionsContent() {
  const t = useTranslations();

  const responseStyleExamples = useMemo(
    () => [
      t("Chat.ChatPreferences.responseStyleExample1"),
      t("Chat.ChatPreferences.responseStyleExample2"),
      t("Chat.ChatPreferences.responseStyleExample3"),
      t("Chat.ChatPreferences.responseStyleExample4"),
    ],
    [],
  );

  const professionExamples = useMemo(
    () => [
      t("Chat.ChatPreferences.professionExample1"),
      t("Chat.ChatPreferences.professionExample2"),
      t("Chat.ChatPreferences.professionExample3"),
      t("Chat.ChatPreferences.professionExample4"),
      t("Chat.ChatPreferences.professionExample5"),
    ],
    [],
  );

  const { data: session } = authClient.useSession();

  const [preferences, setPreferences] = useObjectState<UserPreferences>({
    displayName: "",
    responseStyleExample: "",
    profession: "",
    botName: "",
  });

  const {
    data,
    mutate: fetchPreferences,
    isLoading,
    isValidating,
  } = useSWR<UserPreferences>("/api/user/preferences", fetcher, {
    fallback: {},
    dedupingInterval: 0,
    onSuccess: (data) => {
      setPreferences(data);
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  const savePreferences = async () => {
    safe(() => setIsSaving(true))
      .ifOk(() =>
        fetch("/api/user/preferences", {
          method: "PUT",
          body: JSON.stringify(preferences),
        }),
      )
      .ifOk(() => fetchPreferences())
      .watch((result) => {
        if (result.isOk)
          toast.success(t("Chat.ChatPreferences.preferencesSaved"));
        else toast.error(t("Chat.ChatPreferences.failedToSavePreferences"));
      })
      .watch(() => setIsSaving(false));
  };

  const isDiff = useMemo(() => {
    if ((data?.displayName || "") !== (preferences.displayName || ""))
      return true;
    if ((data?.profession || "") !== (preferences.profession || ""))
      return true;
    if (
      (data?.responseStyleExample || "") !==
      (preferences.responseStyleExample || "")
    )
      return true;
    if ((data?.botName || "") !== (preferences.botName || "")) return true;
    return false;
  }, [preferences, data]);

  return (
    <div className="flex flex-col">
      <h3 className="text-xl font-semibold">
        {t("Chat.ChatPreferences.userInstructions")}
      </h3>
      <p className="text-sm text-muted-foreground py-2 pb-6">
        {t("Chat.ChatPreferences.userInstructionsDescription")}
      </p>

      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-2">
          <Label>{t("Chat.ChatPreferences.whatShouldWeCallYou")}</Label>
          {isLoading ? (
            <Skeleton className="h-9" />
          ) : (
            <Input
              placeholder={session?.user.name || ""}
              value={preferences.displayName}
              onChange={(e) => {
                setPreferences({
                  displayName: e.target.value,
                });
              }}
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("Chat.ChatPreferences.botName")}</Label>
          {isLoading ? (
            <Skeleton className="h-9" />
          ) : (
            <Input
              placeholder="Crafty AI"
              value={preferences.botName}
              onChange={(e) => {
                setPreferences({
                  botName: e.target.value,
                });
              }}
            />
          )}
        </div>

        <div className="flex flex-col gap-2 text-foreground flex-1">
          <Label>{t("Chat.ChatPreferences.whatBestDescribesYourWork")}</Label>
          <div className="relative w-full">
            {isLoading ? (
              <Skeleton className="h-9" />
            ) : (
              <>
                <Input
                  value={preferences.profession}
                  onChange={(e) => {
                    setPreferences({
                      profession: e.target.value,
                    });
                  }}
                />
                {(preferences.profession?.length ?? 0) === 0 && (
                  <div className="absolute left-0 top-0 w-full h-full py-2 px-4 pointer-events-none">
                    <ExamplePlaceholder placeholder={professionExamples} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 text-foreground">
          <Label>
            {t(
              "Chat.ChatPreferences.whatPersonalPreferencesShouldBeTakenIntoAccountInResponses",
            )}
          </Label>
          <span className="text-xs text-muted-foreground"></span>
          <div className="relative w-full">
            {isLoading ? (
              <Skeleton className="h-60" />
            ) : (
              <>
                <Textarea
                  className="h-40 resize-none"
                  value={preferences.responseStyleExample}
                  onChange={(e) => {
                    setPreferences({
                      responseStyleExample: e.target.value,
                    });
                  }}
                />
                {(preferences.responseStyleExample?.length ?? 0) === 0 && (
                  <div className="absolute left-0 top-0 w-full h-full py-2 px-4 pointer-events-none">
                    <ExamplePlaceholder placeholder={responseStyleExamples} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {isDiff && !isValidating && (
        <div className="flex pt-4 items-center justify-end fade-in animate-in duration-300">
          <Button variant="ghost">{t("Common.cancel")}</Button>
          <Button disabled={isSaving || isLoading} onClick={savePreferences}>
            {t("Common.save")}
            {isSaving && <Loader className="size-4 ml-2 animate-spin" />}
          </Button>
        </div>
      )}
    </div>
  );
}

export function MCPInstructionsContent() {
  const t = useTranslations("");
  const [search, setSearch] = useState("");
  const [mcpServer, setMcpServer] = useState<
    (MCPServerInfo & { id: string }) | null
  >(null);

  const { isLoading, data: mcpList } = useMcpList();

  if (mcpServer) {
    return (
      <McpServerCustomizationContent
        title={
          <div className="flex flex-col">
            <button
              onClick={() => setMcpServer(null)}
              className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="size-3" />
              {t("Common.back")}
            </button>
            {mcpServer.name}
          </div>
        }
        mcpServerInfo={mcpServer}
      />
    );
  }

  return (
    <div className="flex flex-col">
      <h3 className="text-xl font-semibold">
        {t("Chat.ChatPreferences.mcpInstructions")}
      </h3>
      <p className="text-sm text-muted-foreground py-2 pb-6">
        {t("Chat.ChatPreferences.mcpInstructionsDescription")}
      </p>

      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-2 text-foreground flex-1">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder={t("Common.search")}
          />
        </div>
        <div className="flex flex-col gap-2 text-foreground flex-1">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="h-14" />
            ))
          ) : mcpList.length === 0 ? (
            <div className="flex flex-col gap-2 text-foreground flex-1">
              <p className="text-center py-8 text-muted-foreground">
                {t("MCP.configureYourMcpServerConnectionSettings")}
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              {mcpList.map((mcp) => (
                <Button
                  onClick={() => setMcpServer({ ...mcp, id: mcp.id })}
                  variant={"outline"}
                  size={"lg"}
                  key={mcp.id}
                >
                  <p>{mcp.name}</p>
                  {mcp.error ? (
                    <AlertCircle className="size-3.5 text-destructive" />
                  ) : mcp.status == "loading" ? (
                    <Loader className="size-3.5 animate-spin" />
                  ) : null}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
