-- Add Z2Data enrichment columns to bom_line_items
ALTER TABLE bom_line_items
  ADD COLUMN z2data_part_id text,
  ADD COLUMN z2data_manufacturer text,
  ADD COLUMN z2data_description text,
  ADD COLUMN z2data_lifecycle_status text,
  ADD COLUMN z2data_rohs text,
  ADD COLUMN z2data_reach text,
  ADD COLUMN z2data_datasheet_url text,
  ADD COLUMN z2data_enriched_at timestamptz,
  ADD COLUMN z2data_error text;

-- Add enrichment tracking columns to assemblies
ALTER TABLE assemblies
  ADD COLUMN z2data_enrichment_status text NOT NULL DEFAULT 'none',
  ADD COLUMN z2data_enriched_count int NOT NULL DEFAULT 0,
  ADD COLUMN z2data_total_enrichable int NOT NULL DEFAULT 0;
