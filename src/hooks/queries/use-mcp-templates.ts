"use client";
import useSWR, { SWRConfiguration } from "swr";
import { fetcher } from "lib/utils";

export type McpTemplate = {
  name: string | null;
  label: string | null;
  config: any;
  icon: string | null;
  isPrivate: boolean;
  version: string | null;
};

export function useMcpTemplates(options?: SWRConfiguration) {
  return useSWR<McpTemplate[]>("/api/mcp/templates", fetcher, options);
}
