-- PartFlow Supply Chain Intelligence - Schema Migration
-- 001_schema.sql

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE lifecycle_status AS ENUM ('Active', 'NRND', 'EOL', 'Obsolete');
CREATE TYPE risk_level       AS ENUM ('Low', 'Medium', 'High', 'Critical');
CREATE TYPE demand_status    AS ENUM ('OK', 'Warning', 'Critical', 'Surplus');
CREATE TYPE alert_severity   AS ENUM ('info', 'warning', 'critical');

-- =============================================================================
-- TABLES
-- =============================================================================

-- Manufacturers
CREATE TABLE manufacturers (
    id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name    text NOT NULL,
    code    char(2),
    country text,
    website text
);

-- Categories
CREATE TABLE categories (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    part_count int  DEFAULT 0
);

-- Parts
CREATE TABLE parts (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mpn              text NOT NULL UNIQUE,
    manufacturer_id  uuid REFERENCES manufacturers(id),
    description      text,
    category_id      uuid REFERENCES categories(id),
    package_info     text,
    specs            jsonb DEFAULT '{}',
    lifecycle_status lifecycle_status DEFAULT 'Active',
    rohs             boolean DEFAULT true,
    reach            boolean DEFAULT true,
    aec_q            boolean DEFAULT false,
    risk_score       int DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level       risk_level DEFAULT 'Low',
    inventory_stock  int DEFAULT 0,
    created_at       timestamptz DEFAULT now()
);

-- Assemblies
CREATE TABLE assemblies (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    customer   text,
    status     text DEFAULT 'Active',
    created_at timestamptz DEFAULT now()
);

-- Assembly Parts (BOM line items)
CREATE TABLE assembly_parts (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assembly_id    uuid NOT NULL REFERENCES assemblies(id) ON DELETE CASCADE,
    part_id        uuid NOT NULL REFERENCES parts(id),
    quantity       int  NOT NULL,
    ref_designator text
);

-- Suppliers
CREATE TABLE suppliers (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    authorized boolean DEFAULT true,
    country    text,
    website    text
);

-- Supplier Offers
CREATE TABLE supplier_offers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id         uuid NOT NULL REFERENCES parts(id),
    supplier_id     uuid NOT NULL REFERENCES suppliers(id),
    packaging       text,
    moq             int DEFAULT 1,
    lead_time_weeks int,
    stock           int DEFAULT 0,
    unit_price      numeric(10, 4),
    currency        text DEFAULT 'USD',
    origin_country  text,
    last_updated    timestamptz DEFAULT now()
);

-- Market Data (historical pricing / availability snapshots)
CREATE TABLE market_data (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id         uuid NOT NULL REFERENCES parts(id),
    recorded_date   date NOT NULL,
    lead_time_weeks int,
    stock_level     int,
    unit_price      numeric(10, 4)
);

-- Production Sites
CREATE TABLE production_sites (
    id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name     text NOT NULL,
    location text,
    country  text
);

-- Demand Forecasts
CREATE TABLE demand_forecasts (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id             uuid NOT NULL REFERENCES parts(id),
    site_id             uuid NOT NULL REFERENCES production_sites(id),
    month               date NOT NULL,
    demand              int,
    available_inventory int,
    on_order            int,
    total_supply        int,
    gap                 int,
    status              demand_status DEFAULT 'OK'
);

-- Risk Events
CREATE TABLE risk_events (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id     uuid NOT NULL REFERENCES parts(id),
    risk_type   text NOT NULL,
    risk_score  int,
    description text,
    country     text,
    created_at  timestamptz DEFAULT now()
);

-- PCN (Product Change Notification) Notifications
CREATE TABLE pcn_notifications (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id        uuid NOT NULL REFERENCES parts(id),
    title          text NOT NULL,
    description    text,
    change_type    text,
    effective_date date,
    created_at     timestamptz DEFAULT now()
);

-- Alerts
CREATE TABLE alerts (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title       text NOT NULL,
    description text,
    severity    alert_severity DEFAULT 'info',
    part_id     uuid REFERENCES parts(id),
    action_url  text,
    created_at  timestamptz DEFAULT now()
);

-- Alternatives (cross-reference between parts)
CREATE TABLE alternatives (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    original_part_id    uuid NOT NULL REFERENCES parts(id),
    alternative_part_id uuid NOT NULL REFERENCES parts(id),
    similarity_score    int CHECK (similarity_score >= 0 AND similarity_score <= 100),
    notes               text
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_parts_mpn             ON parts(mpn);
CREATE INDEX idx_parts_manufacturer    ON parts(manufacturer_id);
CREATE INDEX idx_parts_category        ON parts(category_id);
CREATE INDEX idx_supplier_offers_part  ON supplier_offers(part_id);
CREATE INDEX idx_market_data_part_date ON market_data(part_id, recorded_date);
CREATE INDEX idx_demand_forecasts_part_site ON demand_forecasts(part_id, site_id);

-- =============================================================================
-- ROW LEVEL SECURITY  (permissive policies for demo / anon access)
-- =============================================================================

ALTER TABLE manufacturers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE assemblies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_parts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_offers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data        ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_sites   ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_forecasts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcn_notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternatives       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON manufacturers      FOR ALL USING (true);
CREATE POLICY "Allow all" ON categories         FOR ALL USING (true);
CREATE POLICY "Allow all" ON parts              FOR ALL USING (true);
CREATE POLICY "Allow all" ON assemblies         FOR ALL USING (true);
CREATE POLICY "Allow all" ON assembly_parts     FOR ALL USING (true);
CREATE POLICY "Allow all" ON suppliers          FOR ALL USING (true);
CREATE POLICY "Allow all" ON supplier_offers    FOR ALL USING (true);
CREATE POLICY "Allow all" ON market_data        FOR ALL USING (true);
CREATE POLICY "Allow all" ON production_sites   FOR ALL USING (true);
CREATE POLICY "Allow all" ON demand_forecasts   FOR ALL USING (true);
CREATE POLICY "Allow all" ON risk_events        FOR ALL USING (true);
CREATE POLICY "Allow all" ON pcn_notifications  FOR ALL USING (true);
CREATE POLICY "Allow all" ON alerts             FOR ALL USING (true);
CREATE POLICY "Allow all" ON alternatives       FOR ALL USING (true);
