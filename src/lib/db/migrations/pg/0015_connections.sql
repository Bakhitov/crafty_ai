-- Connections table to link Better-Chatbot with Evolution API and Chatwoot
CREATE TABLE IF NOT EXISTS "connection" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "type" varchar NOT NULL DEFAULT 'whatsapp_evolution',
  "display_name" text,
  "status" varchar NOT NULL DEFAULT 'connecting',

  "evolution_instance_name" text UNIQUE,
  "evolution_apikey_encrypted" jsonb,

  "chatwoot_account_id" text,
  "chatwoot_inbox_id" text,
  "chatwoot_hmac_encrypted" jsonb,
  "chatwoot_webhook_url" text,

  "provider_metadata" jsonb,

  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS connection_user_id_idx ON "connection" ("user_id");
