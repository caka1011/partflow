export type LifecycleStatus = "Active" | "NRND" | "EOL" | "Obsolete";
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type DemandStatus = "OK" | "Warning" | "Critical" | "Surplus";
export type AlertSeverity = "info" | "warning" | "critical";

export interface Manufacturer {
  id: string;
  name: string;
  code: string;
  country: string;
  website: string;
}

export interface Category {
  id: string;
  name: string;
  part_count: number;
}

export interface Part {
  id: string;
  mpn: string;
  manufacturer_id: string;
  description: string;
  category_id: string;
  package_info: string;
  specs: Record<string, unknown>;
  lifecycle_status: LifecycleStatus;
  rohs: boolean;
  reach: boolean;
  aec_q: boolean;
  risk_score: number;
  risk_level: RiskLevel;
  inventory_stock: number;
  created_at: string;
  manufacturer?: Manufacturer;
  category?: Category;
}

export interface Assembly {
  id: string;
  name: string;
  customer: string;
  status: string;
  line_item_count: number;
  total_quantity: number;
  created_at: string;
}

export interface BomLineItemRow {
  id: string;
  assembly_id: string;
  line_number: number;
  section: string;
  value: string;
  shorttext: string;
  quantity: number;
  supplier1_name: string | null;
  supplier1_order_number: string | null;
  supplier2_name: string | null;
  supplier2_order_number: string | null;
  created_at: string;
}

export interface AssemblyPart {
  id: string;
  assembly_id: string;
  part_id: string;
  quantity: number;
  ref_designator: string;
  assembly?: Assembly;
  part?: Part;
}

export interface Supplier {
  id: string;
  name: string;
  authorized: boolean;
  country: string;
  website: string;
}

export interface SupplierOffer {
  id: string;
  part_id: string;
  supplier_id: string;
  packaging: string;
  moq: number;
  lead_time_weeks: number;
  stock: number;
  unit_price: number;
  currency: string;
  origin_country: string;
  last_updated: string;
  supplier?: Supplier;
}

export interface MarketData {
  id: string;
  part_id: string;
  recorded_date: string;
  lead_time_weeks: number;
  stock_level: number;
  unit_price: number;
}

export interface ProductionSite {
  id: string;
  name: string;
  location: string;
  country: string;
}

export interface DemandForecast {
  id: string;
  part_id: string;
  site_id: string;
  month: string;
  demand: number;
  available_inventory: number;
  on_order: number;
  total_supply: number;
  gap: number;
  status: DemandStatus;
  site?: ProductionSite;
}

export interface RiskEvent {
  id: string;
  part_id: string;
  risk_type: string;
  risk_score: number;
  description: string;
  country: string;
  created_at: string;
}

export interface PcnNotification {
  id: string;
  part_id: string;
  title: string;
  description: string;
  change_type: string;
  effective_date: string;
  created_at: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  part_id: string;
  action_url: string;
  created_at: string;
}

export interface Alternative {
  id: string;
  original_part_id: string;
  alternative_part_id: string;
  similarity_score: number;
  notes: string;
  original_part?: Part;
  alternative_part?: Part;
}
