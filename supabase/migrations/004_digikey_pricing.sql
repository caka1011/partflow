-- PartFlow — DigiKey Pricing Enrichment
-- 004_digikey_pricing.sql

-- Add DigiKey pricing fields to bom_line_items
ALTER TABLE bom_line_items
  ADD COLUMN digikey_part_number text,
  ADD COLUMN digikey_unit_price numeric(10, 4),
  ADD COLUMN digikey_currency text DEFAULT 'EUR',
  ADD COLUMN digikey_stock int,
  ADD COLUMN digikey_moq int,
  ADD COLUMN digikey_lead_weeks text,
  ADD COLUMN digikey_product_url text,
  ADD COLUMN digikey_enriched_at timestamptz,
  ADD COLUMN digikey_error text;

-- Add DigiKey enrichment tracking to assemblies
ALTER TABLE assemblies
  ADD COLUMN digikey_enrichment_status text NOT NULL DEFAULT 'none',
  ADD COLUMN digikey_enriched_count int NOT NULL DEFAULT 0,
  ADD COLUMN digikey_total_enrichable int NOT NULL DEFAULT 0;
