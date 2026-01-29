-- Add MiniMax token prices
-- Pricing from https://www.minimaxi.com/platform/pricing

INSERT INTO "token_price" ("provider", "model", "price_per_million_input", "price_per_million_output")
VALUES 
  ('minimax', 'MiniMax-M2', '0.30', '1.20'),
  ('minimax', 'MiniMax-M2.1', '0.30', '1.20'),
  ('minimax', 'MiniMax-M2.1-lightning', '0.30', '2.40')
ON CONFLICT ("model") DO UPDATE SET
  "provider" = EXCLUDED."provider",
  "price_per_million_input" = EXCLUDED."price_per_million_input",
  "price_per_million_output" = EXCLUDED."price_per_million_output",
  "updated_at" = NOW();
