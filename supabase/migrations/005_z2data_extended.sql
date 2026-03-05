-- 005_z2data_extended.sql
-- Add extended Z2Data fields to bom_line_items

ALTER TABLE bom_line_items
  -- Lifecycle extended
  ADD COLUMN z2data_lifecycle_source text,
  ADD COLUMN z2data_estimated_years_to_eol int,
  ADD COLUMN z2data_lc_comment text,
  ADD COLUMN z2data_forecasted_obsolescence_year int,
  -- Compliance extended
  ADD COLUMN z2data_rohs_version text,
  ADD COLUMN z2data_reach_version text,
  ADD COLUMN z2data_china_rohs text,
  ADD COLUMN z2data_tsca text,
  ADD COLUMN z2data_ca_prop65 text,
  ADD COLUMN z2data_scip_id text,
  ADD COLUMN z2data_lead_free_status text,
  -- Manufacturing locations (JSONB arrays)
  ADD COLUMN z2data_country_of_origin jsonb,
  ADD COLUMN z2data_manufacturing_locations jsonb,
  -- Trade codes (JSONB array)
  ADD COLUMN z2data_trade_codes jsonb;
