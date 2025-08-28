import { ApiKeysJson } from "app-types/user";
import { pgDb as db } from "../db.pg";
import { UserSchema } from "../schema.pg";
import { eq } from "drizzle-orm";

export type UserSecretRepository = {
  getApiKeys: (userId: string) => Promise<ApiKeysJson | null>;
  setApiKeys: (userId: string, apiKeys: ApiKeysJson) => Promise<void>;
};

export const pgUserSecretRepository: UserSecretRepository = {
  async getApiKeys(userId) {
    const [row] = await db
      .select({ apiKeys: UserSchema.apiKeys })
      .from(UserSchema)
      .where(eq(UserSchema.id, userId));
    return row?.apiKeys ?? null;
  },
  async setApiKeys(userId, apiKeys) {
    await db
      .update(UserSchema)
      .set({ apiKeys, updatedAt: new Date() })
      .where(eq(UserSchema.id, userId));
  },
};
