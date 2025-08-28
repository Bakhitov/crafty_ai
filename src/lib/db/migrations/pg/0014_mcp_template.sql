CREATE TABLE IF NOT EXISTS "mcp_template" (
  "name" text DEFAULT NULL,
  "label" text DEFAULT NULL,
  "config" json NOT NULL,
  "icon" text DEFAULT NULL,
  "is_private" boolean DEFAULT false NOT NULL,
  "version" text DEFAULT NULL
);


