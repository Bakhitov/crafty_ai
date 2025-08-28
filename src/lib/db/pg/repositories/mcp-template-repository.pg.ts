import { pgDb as db } from "../db.pg";
import { McpTemplateSchema } from "../schema.pg";

export type McpTemplate = typeof McpTemplateSchema.$inferSelect;

export const pgMcpTemplateRepository = {
  async selectAll(): Promise<McpTemplate[]> {
    return db.select().from(McpTemplateSchema);
  },
};
