import { pgDb as db } from "../db.pg";
import { ChannelAgentMapSchema } from "../schema.pg";
import { and, eq } from "drizzle-orm";

export const ChannelAgentMapRepository = {
  async upsert(options: {
    userId: string;
    chatwootInboxId: string;
    agentId: string;
  }) {
    const { userId, chatwootInboxId, agentId } = options;
    const existing = await db
      .select()
      .from(ChannelAgentMapSchema)
      .where(
        and(
          eq(ChannelAgentMapSchema.userId, userId),
          eq(ChannelAgentMapSchema.chatwootInboxId, chatwootInboxId),
        ),
      );
    if (existing[0]) {
      const [row] = await db
        .update(ChannelAgentMapSchema)
        .set({ agentId, createdAt: existing[0].createdAt })
        .where(
          and(
            eq(ChannelAgentMapSchema.userId, userId),
            eq(ChannelAgentMapSchema.chatwootInboxId, chatwootInboxId),
          ),
        )
        .returning();
      return row;
    }
    const [row] = await db
      .insert(ChannelAgentMapSchema)
      .values({ userId, chatwootInboxId, agentId })
      .returning();
    return row;
  },

  async findByInbox(options: { userId: string; chatwootInboxId: string }) {
    const { userId, chatwootInboxId } = options;
    const [row] = await db
      .select()
      .from(ChannelAgentMapSchema)
      .where(
        and(
          eq(ChannelAgentMapSchema.userId, userId),
          eq(ChannelAgentMapSchema.chatwootInboxId, chatwootInboxId),
        ),
      );
    return row ?? null;
  },

  async delete(options: { userId: string; chatwootInboxId: string }) {
    const { userId, chatwootInboxId } = options;
    const [row] = await db
      .delete(ChannelAgentMapSchema)
      .where(
        and(
          eq(ChannelAgentMapSchema.userId, userId),
          eq(ChannelAgentMapSchema.chatwootInboxId, chatwootInboxId),
        ),
      )
      .returning();
    return row ?? null;
  },
};
