-- 002_bom_line_items.sql
-- Stores raw BOM line items as parsed from uploaded files.

CREATE TABLE bom_line_items (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assembly_id             uuid NOT NULL REFERENCES assemblies(id) ON DELETE CASCADE,
    line_number             int  NOT NULL,
    section                 text NOT NULL DEFAULT 'General',
    value                   text NOT NULL DEFAULT '',
    shorttext               text NOT NULL DEFAULT '',
    quantity                int  NOT NULL DEFAULT 0,
    supplier1_name          text,
    supplier1_order_number  text,
    supplier2_name          text,
    supplier2_order_number  text,
    created_at              timestamptz DEFAULT now()
);

CREATE INDEX idx_bom_line_items_assembly ON bom_line_items(assembly_id);

ALTER TABLE bom_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON bom_line_items FOR ALL USING (true);

-- Denormalized counts on assemblies to avoid joins on list page
ALTER TABLE assemblies ADD COLUMN line_item_count int DEFAULT 0;
ALTER TABLE assemblies ADD COLUMN total_quantity  int DEFAULT 0;
