"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "ui/dialog";
import { Button } from "ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import type { ChatModel } from "app-types/chat";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useChatModels } from "@/hooks/queries/use-chat-models";
import { ModelProviderIcon } from "ui/model-provider-icon";
import { CheckIcon } from "lucide-react";

export function ImageSettingsPanel({
  chatModel,
  engine,
  setEngine,
  size,
  setSize,
  style,
  setStyle,
  quality,
  setQuality,
  aspectRatio,
  setAspectRatio,
  providerOptionsText,
  setProviderOptionsText,
  imageModel,
  setImageModel,
}: {
  chatModel?: ChatModel | null;
  engine: string;
  setEngine: (v: string) => void;
  size: string;
  setSize: (v: string) => void;
  style: string;
  setStyle: (v: string) => void;
  quality: string;
  setQuality: (v: string) => void;
  aspectRatio: string;
  setAspectRatio: (v: string) => void;
  providerOptionsText: string;
  setProviderOptionsText: (v: string) => void;
  imageModel: string;
  setImageModel: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const { data: providers } = useChatModels();

  const provider = chatModel?.provider || "";
  const model = chatModel?.model || "";

  const isOpenAI = provider === "openai";
  const isDalle3 = isOpenAI && model === "dall-e-3";
  const isGPTImage1 = isOpenAI && model === "gpt-image-1";
  const isGoogle = provider === "google";

  const sizeOptions = useMemo(() => {
    if (isDalle3) return ["1024x1024", "1792x1024", "1024x1792"];
    if (isGPTImage1) return ["1024x1024", "1536x1024", "1024x1536"];
    return ["1024x1024"]; // fallback
  }, [isDalle3, isGPTImage1]);

  // deprecated: replaced by dynamicRatioOptions based on selected engine

  // Эффективный движок и модель для UI на базе выбранной imageModel/engine
  const selectedImageModelName = imageModel || model;
  const selectedEngine = useMemo(() => {
    const eng = (engine || "auto").toLowerCase();
    if (eng !== "auto") return eng;
    // найти провайдера по выбранной imageModel, иначе провайдер чата
    const match = (providers || [])
      .map((p) => ({ provider: p.provider, has: p.models.some((m) => m.name === selectedImageModelName && m.supportsImage) }))
      .find((x) => x.has);
    return (match?.provider || provider || "").toLowerCase();
  }, [engine, providers, selectedImageModelName, provider]);

  const supportsSize = selectedEngine === "openai" || selectedEngine === "replicate";
  const supportsRatio = selectedEngine === "google" || selectedEngine === "luma" || selectedEngine === "replicate" || selectedEngine === "fal";

  const dynamicSizeOptions = useMemo(() => {
    if (selectedEngine === "openai") {
      if (selectedImageModelName === "dall-e-3") return ["1024x1024", "1792x1024", "1024x1792"];
      if (selectedImageModelName === "gpt-image-1") return ["1024x1024", "1536x1024", "1024x1536"];
    }
    if (selectedEngine === "replicate") return ["1024x1024", "1536x1024", "1024x1536", "1792x1024", "1024x1792"];
    return ["1024x1024"]; // fallback
  }, [selectedEngine, selectedImageModelName]);

  const dynamicRatioOptions = useMemo(() => {
    if (selectedEngine === "google") return ["", "1:1", "3:4", "4:3", "9:16", "16:9"]; // Imagen
    return ["", "1:1", "3:2", "2:3", "16:9", "9:16", "4:3", "3:4"]; // generic
  }, [selectedEngine]);

  const applyPreset = (preset: string) => {
    // Общие популярные форматы/площадки
    // Выбираем aspectRatio, а для OpenAI не-Google подберём ближайший размер из sizeOptions
    const presets: Record<string, { ratio: string; size?: string }> = {
      Instagram: { ratio: "1:1", size: "1024x1024" },
      "Instagram Story": { ratio: "9:16", size: "1024x1792" },
      TikTok: { ratio: "9:16", size: "1024x1792" },
      "YouTube Thumbnail": { ratio: "16:9", size: "1792x1024" },
      "YouTube Shorts": { ratio: "9:16", size: "1024x1792" },
      "X Post": { ratio: "16:9", size: "1792x1024" },
      Pinterest: { ratio: "2:3", size: "1024x1536" },
    };

    const target = presets[preset];
    if (!target) return;

    setAspectRatio(target.ratio);

    // Для провайдеров, где управляем именно size (OpenAI DALLE/GPT-Image):
    if (!isGoogle) {
      // Если целевой size доступен — применим его, иначе возьмём первый из списка с тем же ориентиром
      if (target.size && sizeOptions.includes(target.size)) {
        setSize(target.size);
      } else {
        // Подбор ближайшего по ориентации
        const portrait = target.ratio === "9:16" || target.ratio === "2:3" || target.ratio === "3:4";
        const landscape = target.ratio === "16:9" || target.ratio === "3:2" || target.ratio === "4:3";
        const square = target.ratio === "1:1";

        const pick = (arr: string[]) => arr.find((s) => sizeOptions.includes(s));

        let candidate: string | undefined;
        if (square) candidate = pick(["1024x1024"]);
        if (!candidate && portrait)
          candidate = pick(["1024x1792", "1024x1536"]);
        if (!candidate && landscape)
          candidate = pick(["1792x1024", "1536x1024"]);

        setSize(candidate || sizeOptions[0]);
      }
    }
  };

  // Собираем image-модели из провайдеров, помеченных supportsImage
  const imageProviders = useMemo(() => {
    return (providers || []).map((p) => ({
      provider: p.provider,
      models: p.models.filter((m) => Boolean(m.supportsImage)).map((m) => m.name),
    }));
  }, [providers]);

  const currentImageModelsForEngine = useMemo(() => {
    const eng = (engine || "auto").toLowerCase();
    if (eng === "auto") return imageProviders.flatMap((p) => p.models);
    const match = imageProviders.find((p) => p.provider.toLowerCase() === eng);
    return match ? match.models : [];
  }, [imageProviders, engine]);

  const availableEngines = useMemo(() => {
    const list = ["auto", ...imageProviders.map((p) => p.provider)];
    return Array.from(new Set(list));
  }, [imageProviders]);

  // Если выбранная модель не принадлежит текущему engine, очищаем модель
  useEffect(() => {
    if (!imageModel) return;
    const eng = (engine || "auto").toLowerCase();
    if (eng === "auto") return;
    const match = imageProviders.find((p) => p.provider.toLowerCase() === eng);
    if (!match || !match.models.includes(imageModel)) {
      setImageModel("");
    }
  }, [engine, imageProviders]);

  return (
    <div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant={"ghost"} size={"sm"} className="rounded-full group hover:bg-input! mr-1">
                <SlidersHorizontal className="size-3" />
                <span className="ml-1 text-xs">Image Settings</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px] rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-sm">
                  Image Settings
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {provider}/{model}
                </p>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {["Instagram", "Instagram Story", "TikTok", "YouTube Thumbnail", "YouTube Shorts", "X Post", "Pinterest"].map((title) => (
                    <Button
                      key={title}
                      variant="secondary"
                      size="sm"
                      className="rounded-full text-xs"
                      onClick={() => applyPreset(title)}
                    >
                      {title}
                    </Button>
                  ))}
                </div>
                <div className="h-px bg-border" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-xs w-20 text-muted-foreground">Model</span>
                    <Popover open={modelOpen} onOpenChange={setModelOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="secondary" size="sm" className="rounded-full data-[state=open]:bg-input! hover:bg-input! min-w-[220px] justify-between">
                          <span className="truncate text-xs">{imageModel || (currentImageModelsForEngine[0] || "Select model")}</span>
                          <ChevronDown className="size-3 ml-2" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[360px] max-h-[320px] overflow-auto" align="start">
                        <Command className="rounded-lg relative shadow-md">
                          <CommandInput placeholder="search image model..." />
                          <CommandList className="p-2 max-h-[280px] overflow-auto" onWheel={(e) => e.stopPropagation()}>
                            <CommandEmpty>No results found.</CommandEmpty>
                            {/* Группировка по провайдерам, как в SelectModel */}
                            {imageProviders.map((p) => (
                              <CommandGroup
                                key={p.provider}
                                heading={
                                  <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                                    <ModelProviderIcon provider={p.provider} className="size-3" />
                                    {p.provider}
                                  </div>
                                }
                                className="pb-2"
                              >
                                {p.models.map((m) => (
                                  <CommandItem
                                    key={`${p.provider}-${m}`}
                                    value={m}
                                    className="cursor-pointer"
                                    onSelect={() => {
                                      setImageModel(m);
                                      // при выборе также синхронизируем engine с провайдером
                                      if (p.provider && setEngine) setEngine(p.provider);
                                      setModelOpen(false);
                                    }}
                                  >
                                    {imageModel === m ? (
                                      <CheckIcon className="size-3" />
                                    ) : (
                                      <div className="ml-3" />
                                    )}
                                    <span className="text-sm ml-1">{m}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            ))}
                            <CommandGroup heading="Custom">
                              <div className="px-2 py-1">
                                <input
                                  className="text-xs w-full bg-transparent border rounded px-2 py-1"
                                  placeholder="Enter custom model id"
                                  value={imageModel}
                                  onChange={(e) => setImageModel(e.currentTarget.value)}
                                />
                              </div>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  {!imageModel && (
                    <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                      <span className="text-xs w-20 text-muted-foreground">Engine</span>
                      <select
                        className="text-xs bg-transparent border rounded px-2 py-1 flex-1"
                        value={engine}
                        onChange={(e) => setEngine(e.currentTarget.value)}
                      >
                        {availableEngines.map((e) => (
                          <option key={e} value={e}>
                            {e}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

            {supportsSize && (
                    <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                      <span className="text-xs w-20 text-muted-foreground">Size</span>
                <select
                  className="text-xs bg-transparent border rounded px-2 py-1 flex-1"
                  value={size}
                  onChange={(e) => setSize(e.currentTarget.value)}
                >
                  {dynamicSizeOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

                  {supportsRatio && (
                    <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                      <span className="text-xs w-20 text-muted-foreground">Ratio</span>
              <select
                className="text-xs bg-transparent border rounded px-2 py-1 flex-1"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.currentTarget.value)}
              >
                {dynamicRatioOptions.map((r) => (
                  <option key={r || "auto"} value={r}>
                    {r || "auto"}
                  </option>
                ))}
              </select>
            </div>
                  )}

            {isDalle3 && (
                    <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                      <span className="text-xs w-20 text-muted-foreground">Style</span>
                <select
                  className="text-xs bg-transparent border rounded px-2 py-1 flex-1"
                  value={style}
                  onChange={(e) => setStyle(e.currentTarget.value)}
                >
                  <option value="vivid">vivid</option>
                  <option value="natural">natural</option>
                </select>
              </div>
            )}

                  <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                    <span className="text-xs w-20 text-muted-foreground">Quality</span>
              <select
                className="text-xs bg-transparent border rounded px-2 py-1 flex-1"
                value={quality}
                onChange={(e) => setQuality(e.currentTarget.value)}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
                  </div>
            </div>

                <div className="h-px bg-border" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Advanced providerOptions (JSON)</span>
              </div>
              <textarea
                className="text-xs bg-transparent border rounded p-2 min-h-20 resize-y"
                placeholder={`{\n  "openai": { "quality": "high" }\n}`}
                value={providerOptionsText}
                onChange={(e) => setProviderOptionsText(e.currentTarget.value)}
              />
              <div className="text-[10px] text-muted-foreground">
                {`- OpenAI: { openai: { quality, style, ... } } | Google: { google: { responseModalities, ... } }`}
              </div>
            </div>
              </div>
            </DialogContent>
          </Dialog>
        </TooltipTrigger>
        <TooltipContent>Image generation settings</TooltipContent>
      </Tooltip>
    </div>
  );
}


