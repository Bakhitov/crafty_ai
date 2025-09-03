"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "ui/card";
import { BackgroundPaths } from "ui/background-paths";
import { EditConnectionPopup } from "@/components/connections/edit-connection-popup";
import { Skeleton } from "ui/skeleton";
import { Badge } from "ui/badge";
import { Think } from "@/components/ui/think";
import Image from "next/image";
import { PiQrCode } from "react-icons/pi";
import { Plus } from "lucide-react";
import { LuMessageCircleMore } from "react-icons/lu";
import { PiChatsCircleBold, PiUsersBold } from "react-icons/pi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
type ServerConnection = {
  id: string;
  type: string;
  displayName?: string | null;
  status: string;
  evolutionInstanceName?: string | null;
  chatwootAccountId?: string | null;
  chatwootInboxId?: string | null;
  provider?: string | null;
  phone?: string | null;
  stats?: { chats?: number; contacts?: number; messages?: number } | null;
  createdAt: string;
  updatedAt: string;
};

export default function ConnectionsPage() {
  const t = useTranslations();
  const [connections, setConnections] = useState<ServerConnection[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [agentByConn, setAgentByConn] = useState<Record<string, string | null>>(
    {},
  );
  const [savingAgentFor, setSavingAgentFor] = useState<string | null>(null);

  useEffect(() => {
    const loadList = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/connections", { cache: "no-store" });
        const data = (await res.json()) as ServerConnection[];
        setConnections(data);
        // Prefetch current agent mapping per connection (best-effort)
        try {
          const entries = await Promise.all(
            data.map(async (c) => {
              try {
                const r = await fetch(
                  `/api/connections/${encodeURIComponent(c.id)}/agent`,
                  { cache: "no-store" },
                );
                const j = (await r.json().catch(() => ({}))) as {
                  agentId?: string | null;
                };
                return [c.id, j?.agentId ?? null] as const;
              } catch {
                return [c.id, null] as const;
              }
            }),
          );
          setAgentByConn(Object.fromEntries(entries));
        } catch {}
      } catch {
        setConnections([]);
      } finally {
        setLoading(false);
      }
    };
    loadList();
  }, []);

  const refreshList = async () => {
    try {
      const res = await fetch("/api/connections", { cache: "no-store" });
      const data = (await res.json()) as ServerConnection[];
      setConnections(data);
      try {
        const entries = await Promise.all(
          data.map(async (c) => {
            try {
              const r = await fetch(
                `/api/connections/${encodeURIComponent(c.id)}/agent`,
                { cache: "no-store" },
              );
              const j = (await r.json().catch(() => ({}))) as {
                agentId?: string | null;
              };
              return [c.id, j?.agentId ?? null] as const;
            } catch {
              return [c.id, null] as const;
            }
          }),
        );
        setAgentByConn(Object.fromEntries(entries));
      } catch {}
    } catch {}
  };
  // Load agents for selector
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/agent?type=mine&limit=100", {
          cache: "no-store",
        });
        const list = (await res.json()) as { id: string; name: string }[];
        setAgents(
          Array.isArray(list)
            ? list.map((a) => ({ id: a.id, name: a.name }))
            : [],
        );
      } catch {
        setAgents([]);
      }
    })();
  }, []);

  const saveAgent = async (connectionId: string) => {
    const agentId = agentByConn[connectionId] || "";
    setSavingAgentFor(connectionId);
    try {
      if (!agentId) {
        await fetch(
          `/api/connections/${encodeURIComponent(connectionId)}/agent`,
          { method: "DELETE" },
        );
      } else {
        await fetch(
          `/api/connections/${encodeURIComponent(connectionId)}/agent`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agentId }),
          },
        );
      }
    } catch {}
    setSavingAgentFor(null);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cls =
      status === "open"
        ? "bg-green-500/10 text-green-600 border-green-500/20"
        : status === "error"
          ? "bg-destructive/10 text-destructive border-destructive/20"
          : status === "close"
            ? "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20"
            : "bg-amber-500/10 text-amber-600 border-amber-500/20";
    const label =
      status === "open"
        ? "Active"
        : status === "qr_required"
          ? "Scan QR"
          : status === "connecting"
            ? "Connecting"
            : status === "close"
              ? "Closed"
              : status === "error"
                ? "Error"
                : status;
    return (
      <Badge variant="secondary" className={`rounded-full border ${cls}`}>
        {label}
      </Badge>
    );
  };

  return (
    <div className="w-full flex flex-col gap-4 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("Connections.title")}</h1>
        <EditConnectionPopup
          onCreated={() => {
            (async () => {
              try {
                const res = await fetch("/api/connections", {
                  cache: "no-store",
                });
                const data = (await res.json()) as ServerConnection[];
                setConnections(data);
              } catch {}
            })();
          }}
        >
          <Button variant="ghost">
            <Plus className="size-4" />
            {t("Common.create")}
          </Button>
        </EditConnectionPopup>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{t("Connections.title")}</h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <EditConnectionPopup
            onCreated={() => {
              (async () => {
                try {
                  const res = await fetch("/api/connections", {
                    cache: "no-store",
                  });
                  const data = (await res.json()) as ServerConnection[];
                  setConnections(data);
                } catch {}
              })();
            }}
          >
            <Card className="relative bg-secondary overflow-hidden cursor-pointer hover:bg-input transition-colors h-[220px]">
              <div className="absolute inset-0 w-full h-full opacity-50">
                <BackgroundPaths />
              </div>
              <CardHeader>
                <CardTitle>
                  <h1 className="text-lg font-bold">
                    {t("Connections.createConnection")}
                  </h1>
                </CardTitle>
                <CardDescription className="mt-2 mb-3">
                  <p>
                    Create a communication channel (WhatsApp, Facebook,
                    Instagram, Telegram, Email, Website Widget, SMS). And
                    connect with your Agents
                  </p>
                </CardDescription>
                <div className="mt-auto ml-auto flex-1">
                  <Button variant="ghost" size="lg">
                    {t("Common.create")}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </EditConnectionPopup>
          {(!connections || loading) &&
            Array(3)
              .fill(null)
              .map((_, index) => (
                <Skeleton key={index} className="w-full h-full" />
              ))}
          {connections &&
            connections.length > 0 &&
            connections.map((c) => (
              <Card key={c.id} className="relative w-full h-full">
                <CardHeader className="h-full flex flex-col">
                  <CardTitle className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 mr-2">
                        {c.type === "whatsapp_evolution" ? (
                          <>
                            <Image
                              src="/badges/whatsapp.png"
                              alt="whatsapp"
                              width={25}
                              height={25}
                              className="w-7 h-7"
                            />
                            <span className="text-xs text-muted-foreground">
                              WhatsApp Web
                            </span>
                          </>
                        ) : c.provider === "telegram" ? (
                          <>
                            <Image
                              src="/badges/telegram.png"
                              alt="telegram"
                              width={25}
                              height={25}
                              className="w-7 h-7"
                            />
                            <span className="text-xs text-muted-foreground">
                              Telegram
                            </span>
                          </>
                        ) : c.provider === "facebook" ? (
                          <>
                            <Image
                              src="/badges/messenger.png"
                              alt="facebook"
                              width={25}
                              height={25}
                              className="w-7 h-7"
                            />
                            <span className="text-xs text-muted-foreground">
                              Facebook
                            </span>
                          </>
                        ) : c.provider === "instagram" ? (
                          <>
                            <Image
                              src="/badges/instagram-dm.png"
                              alt="instagram"
                              width={25}
                              height={25}
                              className="w-7 h-7"
                            />
                            <span className="text-xs text-muted-foreground">
                              Instagram
                            </span>
                          </>
                        ) : c.provider === "line" ? (
                          <>
                            <Image
                              src="/badges/line.png"
                              alt="line"
                              width={25}
                              height={25}
                              className="w-7 h-7"
                            />
                            <span className="text-xs text-muted-foreground">
                              Line
                            </span>
                          </>
                        ) : c.provider === "sms" ? (
                          <>
                            <Image
                              src="/badges/sms.png"
                              alt="sms"
                              width={25}
                              height={25}
                              className="w-7 h-7"
                            />
                            <span className="text-xs text-muted-foreground">
                              SMS
                            </span>
                          </>
                        ) : c.provider === "email" ? (
                          <>
                            <Image
                              src="/badges/email.png"
                              alt="email"
                              width={25}
                              height={25}
                              className="w-7 h-7"
                            />
                            <span className="text-xs text-muted-foreground">
                              Email
                            </span>
                          </>
                        ) : c.provider === "api" ? (
                          <>
                            <Image
                              src="/badges/api.png"
                              alt="api"
                              width={25}
                              height={25}
                              className="w-7 h-7"
                            />
                            <span className="text-xs text-muted-foreground">
                              API
                            </span>
                          </>
                        ) : c.provider === "widget" ? (
                          <>
                            <Image
                              src="/badges/widget.png"
                              alt="widget"
                              width={25}
                              height={25}
                              className="w-7 h-7"
                            />
                            <span className="text-xs text-muted-foreground">
                              Widget
                            </span>
                          </>
                        ) : (
                          <>
                            <Image
                              src="/badges/whatsapp.png"
                              alt="channel"
                              width={25}
                              height={25}
                              className="w-7 h-7"
                            />
                            <span className="text-xs text-muted-foreground">
                              Channel
                            </span>
                          </>
                        )}
                      </div>
                      <StatusBadge status={c.status} />
                      <div className="flex items-center gap-1 mr-1">
                        <Think
                          color={
                            c.status === "open"
                              ? "green"
                              : c.status === "error"
                                ? "red"
                                : c.status === "close"
                                  ? "amber"
                                  : "amber"
                          }
                        />
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription className="truncate">
                    <div className="flex flex-col text-left mt-3">
                      <div className="text-lg font-bold text-foreground mb-1">
                        {c.phone ? `+${c.phone} ` : ""}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        {c.displayName || c.evolutionInstanceName || c.id}
                      </div>
                    </div>
                    {c.chatwootInboxId && (
                      <div className="flex items-center gap-2 mt-3">
                        <Select
                          value={agentByConn[c.id] ?? undefined}
                          onValueChange={(v) =>
                            setAgentByConn((m) => ({
                              ...m,
                              [c.id]: v === "__none__" ? null : v,
                            }))
                          }
                        >
                          <SelectTrigger className="min-w-[200px]">
                            <SelectValue placeholder="Select agent" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">No agent</SelectItem>
                            {agents.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          className="px-3 py-1 rounded border hover:bg-muted text-sm"
                          onClick={() => saveAgent(c.id)}
                          disabled={savingAgentFor === c.id}
                          title="Save agent"
                        >
                          {savingAgentFor === c.id ? "..." : "Save"}
                        </button>
                      </div>
                    )}
                  </CardDescription>
                  <div className="mt-3 flex items-center gap-2 pt-3">
                    {c.type === "whatsapp_evolution" &&
                      c.status === "qr_required" && (
                        <button
                          title="Show QR"
                          className="p-2 hover:bg-muted rounded"
                          onClick={() =>
                            window.open(
                              `/api/connections/${encodeURIComponent(c.id)}/connect`,
                              "_blank",
                            )
                          }
                        >
                          <span className="sr-only">QR</span>
                          <PiQrCode className="w-5 h-5" />
                        </button>
                      )}
                    <button
                      title="Restart"
                      className="p-2 hover:bg-muted rounded"
                      onClick={async () => {
                        await fetch(
                          `/api/connections/${encodeURIComponent(c.id)}/restart`,
                          { method: "POST" },
                        );
                        await refreshList();
                      }}
                      disabled={c.status === "open"}
                    >
                      <span className="sr-only">Restart</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <polyline points="1 20 1 14 7 14"></polyline>
                        <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10"></path>
                        <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14"></path>
                      </svg>
                    </button>
                    <button
                      title="Logout"
                      className="p-2 hover:bg-muted rounded"
                      onClick={async () => {
                        await fetch(
                          `/api/connections/${encodeURIComponent(c.id)}/logout`,
                          { method: "DELETE" },
                        );
                        await refreshList();
                      }}
                      disabled={c.status !== "open"}
                    >
                      <span className="sr-only">Logout</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                    </button>
                    <button
                      title="Delete"
                      className="p-2 hover:bg-muted rounded text-destructive"
                      onClick={async () => {
                        await fetch(
                          `/api/connections/${encodeURIComponent(c.id)}/delete`,
                          { method: "DELETE" },
                        );
                        await refreshList();
                      }}
                    >
                      <span className="sr-only">Delete</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                        <path d="M10 11v6"></path>
                        <path d="M14 11v6"></path>
                        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                    <div className="ml-auto text-xs text-muted-foreground flex items-center gap-4">
                      {c.stats?.messages != null && (
                        <span className="flex items-center gap-1">
                          <LuMessageCircleMore className="w-4 h-4" />
                          {c.stats.messages}
                        </span>
                      )}
                      {c.stats?.chats != null && (
                        <span className="flex items-center gap-1">
                          <PiChatsCircleBold className="w-4 h-4" />
                          {c.stats.chats}
                        </span>
                      )}
                      {c.stats?.contacts != null && (
                        <span className="flex items-center gap-1">
                          <PiUsersBold className="w-4 h-4" />
                          {c.stats.contacts}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
