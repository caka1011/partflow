-- 3-legged OAuth token storage for DigiKey API
-- Single-row table: only one DigiKey connection per instance

CREATE TABLE digikey_oauth_tokens (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
