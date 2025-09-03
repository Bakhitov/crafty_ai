import { pgDb as db } from "../db.pg";
import { ConnectionSchema } from "../schema.pg";
import { eq, and } from "drizzle-orm";
import { EncryptedPayload } from "lib/security/key-crypto";

export type CreateConnectionInput = {
  userId: string;
  type: "whatsapp_evolution" | "chatwoot_channel";
  displayName?: string | null;
  status?: "qr_required" | "connecting" | "open" | "close" | "error";
  evolutionInstanceName?: string | null;
  evolutionApikeyEncrypted?: EncryptedPayload | null;
  chatwootAccountId?: string | null;
  chatwootInboxId?: string | null;
  chatwootHmacEncrypted?: EncryptedPayload | null;
  chatwootWebhookUrl?: string | null;
  providerMetadata?: Record<string, unknown> | null;
};

export const ConnectionRepository = {
  async create(input: CreateConnectionInput) {
    const [row] = await db
      .insert(ConnectionSchema)
      .values({
        userId: input.userId,
        type: input.type,
        displayName: input.displayName ?? null,
        status: input.status ?? "connecting",
        evolutionInstanceName: input.evolutionInstanceName ?? null,
        evolutionApikeyEncrypted: input.evolutionApikeyEncrypted ?? null,
        chatwootAccountId: input.chatwootAccountId ?? null,
        chatwootInboxId: input.chatwootInboxId ?? null,
        chatwootHmacEncrypted: input.chatwootHmacEncrypted ?? null,
        chatwootWebhookUrl: input.chatwootWebhookUrl ?? null,
        providerMetadata: input.providerMetadata ?? null,
      })
      .returning();
    return row;
  },

  async listByUser(userId: string) {
    const rows = await db
      .select()
      .from(ConnectionSchema)
      .where(eq(ConnectionSchema.userId, userId));
    return rows;
  },

  async findByIdAndUser(id: string, userId: string) {
    const [row] = await db
      .select()
      .from(ConnectionSchema)
      .where(
        and(eq(ConnectionSchema.id, id), eq(ConnectionSchema.userId, userId)),
      );
    return row ?? null;
  },

  async findById(id: string) {
    const [row] = await db
      .select()
      .from(ConnectionSchema)
      .where(eq(ConnectionSchema.id, id));
    return row ?? null;
  },

  async updateStatus(
    id: string,
    userId: string,
    status: "qr_required" | "connecting" | "open" | "close" | "error",
  ) {
    const [row] = await db
      .update(ConnectionSchema)
      .set({ status, updatedAt: new Date() })
      .where(
        and(eq(ConnectionSchema.id, id), eq(ConnectionSchema.userId, userId)),
      )
      .returning();
    return row ?? null;
  },
  async updateStatusById(
    id: string,
    status: "qr_required" | "connecting" | "open" | "close" | "error",
  ) {
    const [row] = await db
      .update(ConnectionSchema)
      .set({ status, updatedAt: new Date() })
      .where(eq(ConnectionSchema.id, id))
      .returning();
    return row ?? null;
  },
  async deleteByIdAndUser(id: string, userId: string) {
    const [row] = await db
      .delete(ConnectionSchema)
      .where(
        and(eq(ConnectionSchema.id, id), eq(ConnectionSchema.userId, userId)),
      )
      .returning();
    return row ?? null;
  },
  async mergeProviderMetadata(id: string, patch: Record<string, unknown>) {
    const [current] = await db
      .select()
      .from(ConnectionSchema)
      .where(eq(ConnectionSchema.id, id));
    const nextMeta = {
      ...(current?.providerMetadata as
        | Record<string, unknown>
        | null
        | undefined),
      ...patch,
    };
    const [row] = await db
      .update(ConnectionSchema)
      .set({ providerMetadata: nextMeta, updatedAt: new Date() })
      .where(eq(ConnectionSchema.id, id))
      .returning();
    return row ?? null;
  },
  async updateDisplayName(id: string, displayName: string) {
    const [row] = await db
      .update(ConnectionSchema)
      .set({ displayName, updatedAt: new Date() })
      .where(eq(ConnectionSchema.id, id))
      .returning();
    return row ?? null;
  },
  async updateChatwootLinkById(
    id: string,
    patch: {
      chatwootAccountId?: string | null;
      chatwootInboxId?: string | null;
      chatwootWebhookUrl?: string | null;
    },
  ) {
    const updateSet: Partial<(typeof ConnectionSchema)["$inferSelect"]> = {
      updatedAt: new Date(),
    } as any;
    if (patch.chatwootAccountId !== undefined)
      updateSet.chatwootAccountId = patch.chatwootAccountId as any;
    if (patch.chatwootInboxId !== undefined)
      updateSet.chatwootInboxId = patch.chatwootInboxId as any;
    if (patch.chatwootWebhookUrl !== undefined)
      updateSet.chatwootWebhookUrl = patch.chatwootWebhookUrl as any;

    const [row] = await db
      .update(ConnectionSchema)
      .set(updateSet)
      .where(eq(ConnectionSchema.id, id))
      .returning();
    return row ?? null;
  },
};
