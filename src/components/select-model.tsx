"use client";

import { appStore } from "@/app/store";
import { useChatModels } from "@/hooks/queries/use-chat-models";
import { ChatModel } from "app-types/chat";
import { CheckIcon, ChevronDown } from "lucide-react";
import { Fragment, memo, PropsWithChildren, useEffect, useState } from "react";
import { Button } from "ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "ui/command";
import { ModelProviderIcon } from "ui/model-provider-icon";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";

interface SelectModelProps {
  onSelect: (model: ChatModel) => void;
  align?: "start" | "end";
  currentModel?: ChatModel;
  showProvider?: boolean;
  /**
   * text: показывать только текстовые модели (без supportsImage)
   * image: показывать только image-модели (supportsImage === true)
   */
  mode?: "text" | "image";
}

export const SelectModel = (props: PropsWithChildren<SelectModelProps>) => {
  const [open, setOpen] = useState(false);
  const { data: providers } = useChatModels();
  const [model, setModel] = useState(props.currentModel);
  // image-capable indication is no longer shown in the main selector

  useEffect(() => {
    const modelToUse = props.currentModel ?? appStore.getState().chatModel;

    if (modelToUse) {
      setModel(modelToUse);
    }
  }, [props.currentModel]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {props.children || (
          <Button
            variant={"secondary"}
            size={"sm"}
            className="data-[state=open]:bg-input! hover:bg-input! "
            data-testid="model-selector-button"
          >
            <div className="mr-auto flex items-center gap-1">
              {(props.showProvider ?? true) && (
                <ModelProviderIcon
                  provider={model?.provider || ""}
                  className="size-2.5 mr-1"
                />
              )}
              <p data-testid="selected-model-name">{model?.model || "model"}</p>
              {/* removed image capability icon from main chat model selector */}
            </div>
            <ChevronDown className="size-3" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[364px]"
        align={props.align || "end"}
        data-testid="model-selector-popover"
      >
        <Command
          className="rounded-lg relative shadow-md h-80"
          value={JSON.stringify(model)}
          onClick={(e) => e.stopPropagation()}
        >
          <CommandInput
            placeholder="search model..."
            data-testid="model-search-input"
          />
          <CommandList className="p-2 max-h-80 overflow-auto">
            <CommandEmpty>No results found.</CommandEmpty>
            {providers?.map((provider, i) => {
              const models = (provider.models || []).filter((item) =>
                (props.mode || "text") === "image" ? item.supportsImage : !item.supportsImage,
              );
              if (models.length === 0) return null;
              return (
              <Fragment key={provider.provider}>
                <CommandGroup
                  heading={<ProviderHeader provider={provider.provider} />}
                  className="pb-4 group"
                  data-testid={`model-provider-${provider.provider}`}
                >
                  {models.map((item) => (
                    <CommandItem
                      key={item.name}
                      className="cursor-pointer"
                      onSelect={() => {
                        setModel({
                          provider: provider.provider,
                          model: item.name,
                        });
                        props.onSelect({
                          provider: provider.provider,
                          model: item.name,
                        });
                        setOpen(false);
                      }}
                      value={item.name}
                      data-testid={`model-option-${provider.provider}-${item.name}`}
                    >
                      {model?.provider === provider.provider &&
                      model?.model === item.name ? (
                        <CheckIcon
                          className="size-3"
                          data-testid="selected-model-check"
                        />
                      ) : (
                        <div className="ml-3" />
                      )}
                      <span className="pr-1">{item.name}</span>
                      {item.isToolCallUnsupported && (
                        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                          No tools
                        </div>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {i < providers?.length - 1 && <CommandSeparator />}
              </Fragment>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const ProviderHeader = memo(function ProviderHeader({
  provider,
}: { provider: string }) {
  return (
    <div className="text-sm text-muted-foreground flex items-center gap-1.5 group-hover:text-foreground transition-colors duration-300">
      {provider === "openai" ? (
        <ModelProviderIcon
          provider="openai"
          className="size-3 text-foreground"
        />
      ) : (
        <ModelProviderIcon provider={provider} className="size-3" />
      )}
      {provider}
    </div>
  );
});
