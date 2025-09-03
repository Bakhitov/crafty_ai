-- Map Chatwoot inboxes to Better-Chatbot agents per user
CREATE TABLE IF NOT EXISTS "channel_agent_map" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "chatwoot_inbox_id" text NOT NULL,
  "agent_id" uuid NOT NULL REFERENCES "agent"("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT channel_agent_map_user_inbox_unique UNIQUE ("user_id", "chatwoot_inbox_id")
);

CREATE INDEX IF NOT EXISTS channel_agent_map_inbox_idx ON "channel_agent_map" ("chatwoot_inbox_id");


