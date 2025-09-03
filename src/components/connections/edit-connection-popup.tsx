"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "ui/dialog";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Textarea } from "ui/textarea";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Image from "next/image";
import { Badge } from "ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ConnectionResult = {
  instance?: {
    instanceName: string;
    instanceId?: string;
    integration?: string;
    status?: string;
  };
  id?: string;
  hash?: string;
  qrcode?: {
    base64?: string;
    pairingCode?: string;
    code?: string;
    count?: number;
  };
};

export function EditConnectionPopup({
  children,
  onCreated,
}: {
  children?: React.ReactNode;
  onCreated?: () => void;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [instanceName, setInstanceName] = useState("");
  const [connectionId, setConnectionId] = useState<string | undefined>();
  const [pairingCode, setPairingCode] = useState<string | undefined>();
  const [qrBase64, setQrBase64] = useState<string | undefined>();
  const [connectTries, setConnectTries] = useState(0);
  // Evolution API не отдаёт TTL/expiry у QR. Скрываем таймер до появления таких полей.
  const [showPairing, setShowPairing] = useState(false);
  const [channelType, setChannelType] = useState<
    | "whatsapp_web"
    | "whatsapp_api"
    | "telegram"
    | "facebook"
    | "instagram"
    | "line"
    | "sms"
    | "email"
    | "api"
    | "widget"
  >("whatsapp_web");
  const [telegramToken, setTelegramToken] = useState("");

  useEffect(() => {
    if (!open) {
      setInstanceName("");
      setPairingCode(undefined);
      setQrBase64(undefined);
      setConnectTries(0);
      setTelegramToken("");
    }
  }, [open]);

  const createInstance = async () => {
    try {
      setLoading(true);
      let res: Response;
      if (channelType === "whatsapp_web") {
        const payload: any = { instanceName, qrcode: true };
        res = await fetch("/api/connections/wa/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (channelType === "telegram") {
        const botToken = telegramToken;
        if (!botToken) {
          toast.error("Telegram bot token is required");
          setLoading(false);
          return;
        }
        res = await fetch("/api/connections/telegram/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instanceName, botToken }),
        });
      } else {
        // Chatwoot generic channels
        const channel = (() => {
          switch (channelType) {
            case "whatsapp_api":
              // Требует предварительно подготовленные данные WhatsApp Cloud (не собираем в UI).
              // Ожидается, что вы заполните позже форму и вызовете этот же endpoint с нужным channel.
              return { type: "whatsapp", provider: "whatsapp_cloud" };
            case "facebook":
              return { type: "facebook" } as any; // может требовать oauth в Chatwoot UI — placeholder
            case "instagram":
              return { type: "instagram" } as any; // placeholder
            case "line":
              return { type: "line" } as any;
            case "sms":
              return { type: "sms" } as any;
            case "email":
              return { type: "email" } as any;
            case "api":
              return { type: "api" } as any;
            case "widget":
              return { type: "web_widget" } as any;
            default:
              return { type: "api" } as any;
          }
        })();
        res = await fetch("/api/connections/chatwoot/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: instanceName, channel }),
        });
      }
      const data = (await res.json()) as ConnectionResult;
      if (!res.ok) throw new Error(JSON.stringify(data));
      if (channelType === "whatsapp_web") {
        setConnectionId(data.id);
        setPairingCode(data.qrcode?.pairingCode);
        setQrBase64(data.qrcode?.base64);
      }

      onCreated?.();
      toast.success(t("Common.success"));
      if (channelType !== "whatsapp_web") {
        setOpen(false);
      }
    } catch {
      toast.error(t("Common.error"));
    } finally {
      setLoading(false);
    }
  };

  const refreshQr = async () => {
    if (!connectionId) return;
    try {
      const res = await fetch(
        `/api/connections/${encodeURIComponent(connectionId)}/connect`,
        {
          method: "POST",
        },
      );
      const data = (await res.json()) as ConnectionResult;
      setPairingCode(data.qrcode?.pairingCode);
      setQrBase64(data.qrcode?.base64);

      setConnectTries((c) => c + 1);
    } catch {
      /* no-op */
    }
  };

  useEffect(() => {
    if (!connectionId || !open) return;
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch(
          `/api/connections/${encodeURIComponent(connectionId)}/status`,
          { cache: "no-store" },
        );
        const data = (await res.json()) as any;
        const state = data?.instance?.state || data?.state;
        if (state === "open") {
          // ensure provider metadata (phone) saved server-side, then refresh list
          try {
            await fetch(
              `/api/connections/${encodeURIComponent(connectionId)}/status`,
              { cache: "no-store" },
            );
            // Retry details a few times to let Evolution persist number
            const retries = 3;
            for (let i = 0; i < retries; i++) {
              await fetch(
                `/api/connections/${encodeURIComponent(connectionId)}/details`,
                { cache: "no-store" },
              );
              if (i < retries - 1) {
                await new Promise((r) => setTimeout(r, 1200));
              }
            }
          } catch {}
          toast.success(t("Common.success"));
          onCreated?.();
          alive = false;
          setOpen(false);
          return;
        }
      } catch {
      } finally {
        if (alive) setTimeout(tick, 2500);
      }
    };
    const h = setTimeout(tick, 2500);
    return () => {
      alive = false;
      clearTimeout(h);
    };
  }, [connectionId, open, t]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="p-2 md:p-8">
        <DialogHeader>
          <DialogTitle>{t("Connections.createConnection")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="channel-type">Channel</Label>
              <Select
                value={channelType}
                onValueChange={(v) => setChannelType(v as any)}
              >
                <SelectTrigger id="channel-type" className="min-w-[240px]">
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      {channelType === "whatsapp_web" && (
                        <Image
                          src="/badges/whatsapp.png"
                          alt="whatsapp"
                          width={18}
                          height={18}
                        />
                      )}
                      {channelType === "whatsapp_api" && (
                        <Image
                          src="/badges/whatsapp_api.png"
                          alt="whatsapp api"
                          width={18}
                          height={18}
                        />
                      )}
                      {channelType === "telegram" && (
                        <Image
                          src="/badges/telegram.png"
                          alt="telegram"
                          width={18}
                          height={18}
                        />
                      )}
                      {channelType === "facebook" && (
                        <Image
                          src="/badges/messenger.png"
                          alt="facebook"
                          width={18}
                          height={18}
                        />
                      )}
                      {channelType === "instagram" && (
                        <Image
                          src="/badges/instagram.png"
                          alt="instagram"
                          width={18}
                          height={18}
                        />
                      )}
                      {channelType === "line" && (
                        <Image
                          src="/badges/line.png"
                          alt="line"
                          width={18}
                          height={18}
                        />
                      )}
                      {channelType === "sms" && (
                        <Image
                          src="/badges/sms.png"
                          alt="sms"
                          width={18}
                          height={18}
                        />
                      )}
                      {channelType === "email" && (
                        <Image
                          src="/badges/email.png"
                          alt="email"
                          width={18}
                          height={18}
                        />
                      )}
                      {channelType === "api" && (
                        <Image
                          src="/badges/api.png"
                          alt="api"
                          width={18}
                          height={18}
                        />
                      )}
                      {channelType === "widget" && (
                        <Image
                          src="/badges/widget.png"
                          alt="widget"
                          width={18}
                          height={18}
                        />
                      )}
                      <span className="capitalize">
                        {channelType.replace("_", " ")}
                      </span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp_web">
                    <span className="flex items-center gap-2">
                      <Image
                        src="/badges/whatsapp.png"
                        alt="whatsapp"
                        width={16}
                        height={16}
                      />{" "}
                      Whatsapp Web
                    </span>
                  </SelectItem>
                  <SelectItem value="whatsapp_api">
                    <span className="flex items-center gap-2">
                      <Image
                        src="/badges/whatsapp_api.png"
                        alt="whatsapp api"
                        width={16}
                        height={16}
                      />{" "}
                      Whatsapp API
                    </span>
                  </SelectItem>
                  <SelectItem value="telegram">
                    <span className="flex items-center gap-2">
                      <Image
                        src="/badges/telegram.png"
                        alt="telegram"
                        width={16}
                        height={16}
                      />{" "}
                      Telegram
                    </span>
                  </SelectItem>
                  <SelectItem value="facebook">
                    <span className="flex items-center gap-2">
                      <Image
                        src="/badges/messenger.png"
                        alt="facebook"
                        width={16}
                        height={16}
                      />{" "}
                      Facebook
                    </span>
                  </SelectItem>
                  <SelectItem value="instagram">
                    <span className="flex items-center gap-2">
                      <Image
                        src="/badges/instagram.png"
                        alt="instagram"
                        width={16}
                        height={16}
                      />{" "}
                      Instagram
                    </span>
                  </SelectItem>
                  <SelectItem value="line">
                    <span className="flex items-center gap-2">
                      <Image
                        src="/badges/line.png"
                        alt="line"
                        width={16}
                        height={16}
                      />{" "}
                      Line
                    </span>
                  </SelectItem>
                  <SelectItem value="sms">
                    <span className="flex items-center gap-2">
                      <Image
                        src="/badges/sms.png"
                        alt="sms"
                        width={16}
                        height={16}
                      />{" "}
                      SMS
                    </span>
                  </SelectItem>
                  <SelectItem value="email">
                    <span className="flex items-center gap-2">
                      <Image
                        src="/badges/email.png"
                        alt="email"
                        width={16}
                        height={16}
                      />{" "}
                      Email
                    </span>
                  </SelectItem>
                  <SelectItem value="api">
                    <span className="flex items-center gap-2">
                      <Image
                        src="/badges/api.png"
                        alt="api"
                        width={16}
                        height={16}
                      />{" "}
                      API
                    </span>
                  </SelectItem>
                  <SelectItem value="widget">
                    <span className="flex items-center gap-2">
                      <Image
                        src="/badges/widget.png"
                        alt="widget"
                        width={16}
                        height={16}
                      />{" "}
                      Widget
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2"></div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="instance-name">
                {t("Connections.instanceName")}
              </Label>
              <Input
                id="instance-name"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="my-instance"
              />
            </div>
            {/* apikey is stored on server; no need to expose */}
          </div>
          {channelType === "telegram" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="telegram-token">Telegram bot token</Label>
                <Input
                  id="telegram-token"
                  type="password"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="1234567890:AA..."
                />
              </div>
            </div>
          )}
          {channelType === "whatsapp_web" && (
            <div className="flex flex-col gap-2">
              <Label>{t("Connections.qrOrCode")}</Label>
              <div className="w-full flex items-center justify-center">
                {qrBase64 ? (
                  <Image
                    src={qrBase64}
                    alt="qr"
                    width={384}
                    height={384}
                    className="w-96 h-96"
                    unoptimized
                  />
                ) : showPairing ? (
                  <Textarea
                    disabled
                    value={pairingCode || ""}
                    placeholder={
                      t("Connections.qrWillAppearAfterCreate") as string
                    }
                    className="max-w-md"
                  />
                ) : (
                  <div className="text-xs text-muted-foreground">
                    QR появится после создания. При проблемах можно
                    <button
                      className="text-primary underline ml-1"
                      onClick={() => setShowPairing(true)}
                      type="button"
                    >
                      показать pairing code
                    </button>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                <Badge variant="secondary" className="rounded-full">
                  {t("Connections.refreshTries", { count: connectTries })}
                </Badge>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("Common.cancel")}
          </Button>
          {channelType === "whatsapp_web" && (
            <Button
              onClick={refreshQr}
              disabled={!connectionId}
              variant="secondary"
            >
              {t("Connections.refreshQr")}
            </Button>
          )}
          {!connectionId && (
            <Button
              onClick={createInstance}
              disabled={
                !instanceName ||
                loading ||
                (channelType === "telegram" && !telegramToken)
              }
            >
              {loading ? "..." : t("Common.create")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
