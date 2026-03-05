"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  ArrowLeft,
  Trash2,
  Hash,
  Package,
  Layers,
  Building2,
  Loader2,
  AlertCircle,
  Zap,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Wrench,
  DollarSign,
  ShoppingCart,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

import { KpiCard } from "@/components/layout/kpi-card";
import { DataTable } from "@/components/data-table/data-table";
import { ChartContainer } from "@/components/charts/chart-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getAssembly,
  deleteAssembly,
  enrichAssembly,
  fetchPricing,
} from "@/lib/actions/assemblies";
import { ResolveDialog } from "@/components/assemblies/resolve-dialog";
import type { BomLineItemRow } from "@/lib/types";

// ---------------------------------------------------------------------------
// Chart helpers
// ---------------------------------------------------------------------------

const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#f97316",
  "#14b8a6",
  "#6366f1",
];

// ---------------------------------------------------------------------------
// Lifecycle badge helper
// ---------------------------------------------------------------------------

function LifecycleBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">-</span>;
  const s = status.toLowerCase();
  let className = "bg-slate-100 text-slate-600 border-slate-200";
  if (s === "active" || s === "production") {
    className = "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (s === "nrnd" || s === "not recommended") {
    className = "bg-amber-100 text-amber-700 border-amber-200";
  } else if (s === "eol" || s === "end of life") {
    className = "bg-orange-100 text-orange-700 border-orange-200";
  } else if (s === "obsolete") {
    className = "bg-red-100 text-red-700 border-red-200";
  }
  return <Badge className={className}>{status}</Badge>;
}

// ---------------------------------------------------------------------------
// BOM line item table columns (slim — details in expandable row)
// ---------------------------------------------------------------------------

const bomColumns: ColumnDef<BomLineItemRow>[] = [
  {
    id: "expand",
    header: "",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.getIsExpanded() ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
      </span>
    ),
    size: 32,
    enableSorting: false,
  },
  {
    accessorKey: "line_number",
    header: "#",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.line_number}</span>
    ),
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.value || "-"}</span>
    ),
  },
  {
    accessorKey: "shorttext",
    header: "Description",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.shorttext}</span>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    cell: ({ row }) => {
      const qty = row.original.quantity;
      return (
        <span className={qty === 0 ? "text-muted-foreground" : "font-medium"}>
          {qty || "-"}
        </span>
      );
    },
  },
  {
    id: "lifecycle",
    header: "Lifecycle",
    cell: ({ row }) => {
      if (row.original.z2data_error) {
        return (
          <span className="text-xs text-red-500" title={row.original.z2data_error}>
            Error
          </span>
        );
      }
      return <LifecycleBadge status={row.original.z2data_lifecycle_status} />;
    },
  },
  {
    id: "rohs",
    header: "RoHS",
    cell: ({ row }) => {
      const rohs = row.original.z2data_rohs;
      if (!rohs) return <span className="text-muted-foreground">-</span>;
      return (
        <Badge
          className={
            rohs.toLowerCase() === "compliant"
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : "bg-amber-100 text-amber-700 border-amber-200"
          }
        >
          {rohs}
        </Badge>
      );
    },
  },
  {
    id: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.original.digikey_unit_price;
      const currency = row.original.digikey_currency;
      if (row.original.digikey_error) {
        return (
          <span className="text-xs text-red-500" title={row.original.digikey_error}>
            N/A
          </span>
        );
      }
      if (price == null) return <span className="text-muted-foreground">-</span>;
      return (
        <span className="font-medium text-sm">
          {price.toFixed(4)} {currency ?? "EUR"}
        </span>
      );
    },
  },
  {
    id: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.original.digikey_stock;
      if (stock == null) return <span className="text-muted-foreground">-</span>;
      return (
        <span
          className={
            stock === 0
              ? "text-red-600 font-medium text-sm"
              : "text-emerald-600 font-medium text-sm"
          }
        >
          {stock.toLocaleString()}
        </span>
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Expanded row detail panel
// ---------------------------------------------------------------------------

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm" title={typeof value === "string" ? value : undefined}>
        {value || <span className="text-muted-foreground">-</span>}
      </dd>
    </div>
  );
}

function BomExpandedRow({ item }: { item: BomLineItemRow }) {
  return (
    <div className="space-y-4 p-4">
      {/* Row 1: Key info in a compact horizontal strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <DetailField label="Manufacturer" value={item.z2data_manufacturer} />
        <DetailField label="Lifecycle" value={<LifecycleBadge status={item.z2data_lifecycle_status} />} />
        {item.z2data_estimated_years_to_eol != null && (
          <DetailField label="Est. Years to EOL" value={String(item.z2data_estimated_years_to_eol)} />
        )}
        {item.z2data_forecasted_obsolescence_year != null && (
          <DetailField label="Obsolescence" value={String(item.z2data_forecasted_obsolescence_year)} />
        )}
        {item.z2data_datasheet_url && (
          <DetailField
            label="Datasheet"
            value={
              <a
                href={item.z2data_datasheet_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                PDF <ExternalLink className="size-3" />
              </a>
            }
          />
        )}
        {item.digikey_product_url && (
          <DetailField
            label="DigiKey"
            value={
              <a
                href={item.digikey_product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Buy <ExternalLink className="size-3" />
              </a>
            }
          />
        )}
      </div>

      {/* Row 2: Detail sections in a 3-column grid */}
      <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-3">
        {/* Compliance */}
        <div className="min-w-0">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Compliance
          </h4>
          <dl className="space-y-1.5">
            <DetailField
              label="RoHS"
              value={
                item.z2data_rohs
                  ? `${item.z2data_rohs}${item.z2data_rohs_version ? ` (${item.z2data_rohs_version})` : ""}`
                  : null
              }
            />
            <DetailField
              label="REACH"
              value={
                item.z2data_reach
                  ? `${item.z2data_reach}${item.z2data_reach_version ? ` (${item.z2data_reach_version})` : ""}`
                  : null
              }
            />
            {item.z2data_china_rohs && <DetailField label="China RoHS" value={item.z2data_china_rohs} />}
            {item.z2data_tsca && <DetailField label="TSCA" value={item.z2data_tsca} />}
            {item.z2data_ca_prop65 && <DetailField label="CA Prop 65" value={item.z2data_ca_prop65} />}
            {item.z2data_scip_id && <DetailField label="SCIP ID" value={item.z2data_scip_id} />}
            {item.z2data_lead_free_status && <DetailField label="Lead Free" value={item.z2data_lead_free_status} />}
          </dl>
        </div>

        {/* Manufacturing */}
        <div className="min-w-0">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Manufacturing
          </h4>
          <dl className="space-y-1.5">
            <DetailField label="Section" value={item.section} />
            <DetailField
              label="Country of Origin"
              value={
                item.z2data_country_of_origin?.length
                  ? item.z2data_country_of_origin.map((c) => c.countryName).join(", ")
                  : null
              }
            />
            {item.z2data_manufacturing_locations?.length ? (
              <div>
                <dt className="text-xs text-muted-foreground">Facilities</dt>
                <dd className="space-y-0.5 text-sm">
                  {item.z2data_manufacturing_locations.map((loc, i) => (
                    <div key={i} className="text-xs">
                      {loc.facilityType} — {loc.cityName}, {loc.countryName}
                      {loc.siteOwner && ` (${loc.siteOwner})`}
                    </div>
                  ))}
                </dd>
              </div>
            ) : (
              <DetailField label="Facilities" value={null} />
            )}
          </dl>
        </div>

        {/* Sourcing */}
        <div className="min-w-0">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sourcing
          </h4>
          <dl className="space-y-1.5">
            {item.z2data_trade_codes?.length ? (
              <div>
                <dt className="text-xs text-muted-foreground">Trade Codes</dt>
                <dd className="space-y-0.5 text-sm">
                  {item.z2data_trade_codes.map((tc, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-medium">{tc.name}:</span> {tc.value}
                    </div>
                  ))}
                </dd>
              </div>
            ) : null}
            {item.supplier1_name && (
              <DetailField
                label="Supplier 1"
                value={
                  <span>
                    {item.supplier1_name}
                    {item.supplier1_order_number && (
                      <span className="ml-1 font-mono text-xs text-muted-foreground">
                        ({item.supplier1_order_number})
                      </span>
                    )}
                  </span>
                }
              />
            )}
            {item.supplier2_name && (
              <DetailField
                label="Supplier 2"
                value={
                  <span>
                    {item.supplier2_name}
                    {item.supplier2_order_number && (
                      <span className="ml-1 font-mono text-xs text-muted-foreground">
                        ({item.supplier2_order_number})
                      </span>
                    )}
                  </span>
                }
              />
            )}
          </dl>
        </div>
      </div>

      {/* Lifecycle comment — full width at bottom if present */}
      {item.z2data_lc_comment && (
        <p className="text-xs text-muted-foreground italic">
          {item.z2data_lc_comment}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

interface AssemblyData {
  id: string;
  name: string;
  customer: string;
  status: string;
  line_item_count: number;
  total_quantity: number;
  created_at: string;
  z2data_enrichment_status?: string;
  z2data_enriched_count?: number;
  z2data_total_enrichable?: number;
  digikey_enrichment_status?: string;
  digikey_enriched_count?: number;
  digikey_total_enrichable?: number;
  bom_line_items: BomLineItemRow[];
}

export default function AssemblyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();

  const [assembly, setAssembly] = useState<AssemblyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Z2Data enrichment state
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState({ enriched: 0, total: 0 });
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const enrichAbort = useRef(false);

  // DigiKey pricing state
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingProgress, setPricingProgress] = useState({ enriched: 0, total: 0 });
  const [pricingError, setPricingError] = useState<string | null>(null);
  const pricingAbort = useRef(false);

  // DigiKey authorization state
  const [digikeyAuthorized, setDigikeyAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/digikey/status")
      .then((r) => r.json())
      .then((d) => setDigikeyAuthorized(d.authorized))
      .catch(() => setDigikeyAuthorized(false));
  }, []);

  useEffect(() => {
    getAssembly(id).then((result) => {
      if (result.success && result.data) {
        setAssembly(result.data as AssemblyData);
      } else {
        setError(result.error ?? "Failed to load assembly");
      }
      setLoading(false);
    });
  }, [id]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    const result = await deleteAssembly(id);
    if (result.success) {
      router.push("/assemblies");
    } else {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }, [id, router]);

  // ---- Z2Data enrichment loop ----
  const handleEnrich = useCallback(async () => {
    setEnriching(true);
    setEnrichError(null);
    enrichAbort.current = false;

    let done = false;
    while (!done && !enrichAbort.current) {
      const result = await enrichAssembly(id);
      if (!result.success) {
        setEnrichError(result.error ?? "Enrichment failed");
        break;
      }

      const { status, enriched_total, enrichable_total } = result.data;
      setEnrichProgress({ enriched: enriched_total, total: enrichable_total });

      if (status === "done") {
        done = true;
      }
    }

    // Reload assembly to get updated BOM data
    const refreshed = await getAssembly(id);
    if (refreshed.success && refreshed.data) {
      setAssembly(refreshed.data as AssemblyData);
    }
    setEnriching(false);
  }, [id]);

  // ---- Resolve failed items ----
  const [resolveOpen, setResolveOpen] = useState(false);

  // ---- DigiKey pricing loop ----
  const handleFetchPricing = useCallback(async () => {
    setPricingLoading(true);
    setPricingError(null);
    pricingAbort.current = false;

    let done = false;
    while (!done && !pricingAbort.current) {
      const result = await fetchPricing(id);
      if (!result.success) {
        setPricingError(result.error ?? "Pricing fetch failed");
        break;
      }

      const { status, enriched_total, enrichable_total } = result.data;
      setPricingProgress({ enriched: enriched_total, total: enrichable_total });

      if (status === "done") {
        done = true;
      }
    }

    // Reload assembly to get updated BOM data
    const refreshed = await getAssembly(id);
    if (refreshed.success && refreshed.data) {
      setAssembly(refreshed.data as AssemblyData);
    }
    setPricingLoading(false);
  }, [id]);

  const handlePartResolved = useCallback(async () => {
    const refreshed = await getAssembly(id);
    if (refreshed.success && refreshed.data) {
      setAssembly(refreshed.data as AssemblyData);
    }
  }, [id]);

  // ---- Derived data ----

  const sections = useMemo(() => {
    if (!assembly) return [];
    const unique = [...new Set(assembly.bom_line_items.map((i) => i.section))];
    return unique;
  }, [assembly]);

  const uniqueSuppliers = useMemo(() => {
    if (!assembly) return [];
    const names = new Set<string>();
    for (const item of assembly.bom_line_items) {
      if (item.supplier1_name) names.add(item.supplier1_name);
      if (item.supplier2_name) names.add(item.supplier2_name);
    }
    return [...names];
  }, [assembly]);

  const sectionChartData = useMemo(() => {
    if (!assembly) return [];
    return sections.map((section) => {
      const items = assembly.bom_line_items.filter(
        (i) => i.section === section
      );
      return {
        section,
        count: items.length,
        qty: items.reduce((sum, i) => sum + i.quantity, 0),
      };
    });
  }, [assembly, sections]);

  const supplierPieData = useMemo(() => {
    if (!assembly) return [];
    const counts: Record<string, number> = {};
    for (const item of assembly.bom_line_items) {
      if (item.supplier1_name) {
        counts[item.supplier1_name] =
          (counts[item.supplier1_name] || 0) + 1;
      }
      if (item.supplier2_name) {
        counts[item.supplier2_name] =
          (counts[item.supplier2_name] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [assembly]);

  // ---- Z2Data insights data ----

  const enrichedItems = useMemo(() => {
    if (!assembly) return [];
    return assembly.bom_line_items.filter((i) => i.z2data_enriched_at);
  }, [assembly]);

  const lifecycleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of enrichedItems) {
      const status = item.z2data_lifecycle_status || "Unknown";
      counts[status] = (counts[status] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [enrichedItems]);

  const complianceSummary = useMemo(() => {
    let rohsCompliant = 0;
    let rohsNonCompliant = 0;
    let reachCompliant = 0;
    let reachNonCompliant = 0;
    for (const item of enrichedItems) {
      if (item.z2data_rohs) {
        if (item.z2data_rohs.toLowerCase() === "compliant") rohsCompliant++;
        else rohsNonCompliant++;
      }
      if (item.z2data_reach) {
        if (item.z2data_reach.toLowerCase() === "compliant") reachCompliant++;
        else reachNonCompliant++;
      }
    }
    return { rohsCompliant, rohsNonCompliant, reachCompliant, reachNonCompliant };
  }, [enrichedItems]);

  const riskCounts = useMemo(() => {
    let eol = 0;
    let obsolete = 0;
    let nrnd = 0;
    for (const item of enrichedItems) {
      const s = (item.z2data_lifecycle_status || "").toLowerCase();
      if (s === "obsolete") obsolete++;
      else if (s === "eol" || s === "end of life") eol++;
      else if (s === "nrnd" || s === "not recommended") nrnd++;
    }
    return { eol, obsolete, nrnd, atRisk: eol + obsolete + nrnd };
  }, [enrichedItems]);

  const hasEnrichment = enrichedItems.length > 0;
  const isEnrichmentDone =
    assembly?.z2data_enrichment_status === "completed" ||
    assembly?.z2data_enrichment_status === "partial";

  const isPricingDone =
    assembly?.digikey_enrichment_status === "completed" ||
    assembly?.digikey_enrichment_status === "partial";

  const pricedItems = useMemo(() => {
    if (!assembly) return [];
    return assembly.bom_line_items.filter((i) => i.digikey_enriched_at);
  }, [assembly]);

  const hasPricing = pricedItems.length > 0;

  const pricingSummary = useMemo(() => {
    let totalBomCost = 0;
    let pricedCount = 0;
    let outOfStockCount = 0;
    for (const item of pricedItems) {
      if (item.digikey_unit_price != null) {
        totalBomCost += item.digikey_unit_price * item.quantity;
        pricedCount++;
      }
      if (item.digikey_stock === 0) outOfStockCount++;
    }
    return { totalBomCost, pricedCount, outOfStockCount };
  }, [pricedItems]);

  // ---- Loading state ----

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ---- Error state ----

  if (error || !assembly) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <AlertCircle className="size-12 text-red-400" />
        <p className="text-lg font-medium">{error ?? "Assembly not found"}</p>
        <Button variant="outline" asChild>
          <Link href="/assemblies">Back to Assemblies</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Breadcrumb + Header                                            */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <Link
          href="/assemblies"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Assemblies
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {assembly.name}
            </h1>
            <div className="mt-1 flex items-center gap-3">
              <Badge
                className={
                  assembly.status === "Active"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }
              >
                {assembly.status}
              </Badge>
              {assembly.customer && assembly.customer !== "-" && (
                <span className="text-sm text-muted-foreground">
                  {assembly.customer}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                Created{" "}
                {new Date(assembly.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Enrich with Z2Data button — hidden once done */}
            {isEnrichmentDone ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1.5 py-1.5 px-3">
                <CheckCircle2 className="size-3.5" />
                Z2Data Enriched ({assembly.z2data_enriched_count}/{assembly.z2data_total_enrichable})
              </Badge>
            ) : (
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleEnrich}
                disabled={enriching}
              >
                {enriching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Zap className="size-4" />
                )}
                {enriching ? "Enriching..." : "Enrich with Z2Data"}
              </Button>
            )}

            {/* Fetch DigiKey Pricing button — show after Z2Data done */}
            {isEnrichmentDone && (
              isPricingDone ? (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1.5 py-1.5 px-3">
                  <DollarSign className="size-3.5" />
                  DigiKey Priced ({assembly.digikey_enriched_count}/{assembly.digikey_total_enrichable})
                </Badge>
              ) : digikeyAuthorized === false ? (
                <Button
                  variant="outline"
                  className="gap-2"
                  asChild
                >
                  <a href="/api/auth/digikey">
                    <ShoppingCart className="size-4" />
                    Connect DigiKey Account
                  </a>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleFetchPricing}
                  disabled={pricingLoading || enriching || digikeyAuthorized === null}
                >
                  {pricingLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="size-4" />
                  )}
                  {pricingLoading ? "Fetching Prices..." : "Fetch DigiKey Pricing"}
                </Button>
              )
            )}

            {/* Delete button */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Assembly</DialogTitle>
                  <DialogDescription>
                    This will permanently delete &quot;{assembly.name}&quot; and
                    all {assembly.bom_line_items.length} BOM line items. This
                    action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="gap-2"
                  >
                    {deleting && <Loader2 className="size-4 animate-spin" />}
                    {deleting ? "Deleting..." : "Delete Assembly"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Enrichment progress bar                                           */}
      {/* ----------------------------------------------------------------- */}
      {enriching && enrichProgress.total > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Enriching {enrichProgress.enriched}/{enrichProgress.total}...
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(
                  (enrichProgress.enriched / enrichProgress.total) * 100
                )}
                %
              </span>
            </div>
            <Progress
              value={
                (enrichProgress.enriched / enrichProgress.total) * 100
              }
            />
          </CardContent>
        </Card>
      )}

      {enrichError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3">
            <p className="text-sm text-red-700">{enrichError}</p>
          </CardContent>
        </Card>
      )}

      {/* DigiKey pricing progress bar */}
      {pricingLoading && pricingProgress.total > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Fetching DigiKey prices {pricingProgress.enriched}/{pricingProgress.total}...
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(
                  (pricingProgress.enriched / pricingProgress.total) * 100
                )}
                %
              </span>
            </div>
            <Progress
              value={
                (pricingProgress.enriched / pricingProgress.total) * 100
              }
            />
          </CardContent>
        </Card>
      )}

      {pricingError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3">
            <p className="text-sm text-red-700">{pricingError}</p>
          </CardContent>
        </Card>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 2. KPI cards                                                      */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Line Items"
          value={assembly.bom_line_items.length}
          icon={Hash}
        />
        <KpiCard
          title="Total Quantity"
          value={assembly.total_quantity?.toLocaleString() ?? "0"}
          icon={Package}
        />
        <KpiCard
          title="Sections"
          value={sections.length}
          icon={Layers}
        />
        <KpiCard
          title="Suppliers"
          value={uniqueSuppliers.length}
          icon={Building2}
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Tabs                                                           */}
      {/* ----------------------------------------------------------------- */}
      <Tabs defaultValue="bom" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bom">BOM Lines</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          {hasEnrichment && (
            <TabsTrigger value="z2data">Z2Data Insights</TabsTrigger>
          )}
          {hasPricing && (
            <TabsTrigger value="pricing">DigiKey Pricing</TabsTrigger>
          )}
        </TabsList>

        {/* ---- BOM Lines Tab ---- */}
        <TabsContent value="bom">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bill of Materials</CardTitle>
              <CardDescription>
                {assembly.bom_line_items.length} line items across{" "}
                {sections.length} sections
                {hasEnrichment && (
                  <> &middot; {enrichedItems.length} enriched with Z2Data</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={bomColumns}
                data={assembly.bom_line_items}
                searchKey="shorttext"
                searchPlaceholder="Search components..."
                renderExpandedRow={(item) => <BomExpandedRow item={item} />}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Analysis Tab ---- */}
        <TabsContent value="analysis" className="space-y-4">
          {/* Section badges */}
          <div className="flex flex-wrap gap-1.5">
            {sections.map((s) => (
              <Badge
                key={s}
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                {s}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartContainer
              title="Components by Section"
              subtitle="Line items per BOM section"
              height={300}
            >
              <BarChart data={sectionChartData} layout="vertical">
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="section"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="count"
                  name="Line Items"
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>

            <ChartContainer
              title="Supplier Distribution"
              subtitle="Component references by supplier"
              height={300}
            >
              <PieChart>
                <Pie
                  data={supplierPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {supplierPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ChartContainer>
          </div>
        </TabsContent>

        {/* ---- Z2Data Insights Tab ---- */}
        {hasEnrichment && (
          <TabsContent value="z2data" className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Zap className="size-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Enriched</p>
                      <p className="text-2xl font-bold">
                        {enrichedItems.length}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{assembly.bom_line_items.filter((i) => i.value?.trim()).length}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-100 p-2">
                      <AlertCircle className="size-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">At Risk</p>
                      <p className="text-2xl font-bold">{riskCounts.atRisk}</p>
                      <p className="text-xs text-muted-foreground">
                        {riskCounts.obsolete} Obsolete, {riskCounts.eol} EOL, {riskCounts.nrnd} NRND
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 p-2">
                      <CheckCircle2 className="size-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">RoHS Compliant</p>
                      <p className="text-2xl font-bold">{complianceSummary.rohsCompliant}</p>
                      {complianceSummary.rohsNonCompliant > 0 && (
                        <p className="text-xs text-red-500">
                          {complianceSummary.rohsNonCompliant} non-compliant
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 p-2">
                      <CheckCircle2 className="size-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">REACH Compliant</p>
                      <p className="text-2xl font-bold">{complianceSummary.reachCompliant}</p>
                      {complianceSummary.reachNonCompliant > 0 && (
                        <p className="text-xs text-red-500">
                          {complianceSummary.reachNonCompliant} non-compliant
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartContainer
                title="Lifecycle Distribution"
                subtitle="Part lifecycle status breakdown"
                height={300}
              >
                <PieChart>
                  <Pie
                    data={lifecycleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {lifecycleDistribution.map((entry, index) => {
                      const s = entry.name.toLowerCase();
                      let fill = PIE_COLORS[index % PIE_COLORS.length];
                      if (s === "active" || s === "production") fill = "#10b981";
                      else if (s === "nrnd" || s === "not recommended")
                        fill = "#f59e0b";
                      else if (s === "eol" || s === "end of life")
                        fill = "#f97316";
                      else if (s === "obsolete") fill = "#ef4444";
                      return (
                        <Cell key={`lc-${entry.name}`} fill={fill} />
                      );
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ChartContainer>

              <ChartContainer
                title="Compliance Summary"
                subtitle="RoHS and REACH compliance overview"
                height={300}
              >
                <BarChart
                  data={[
                    {
                      name: "RoHS",
                      Compliant: complianceSummary.rohsCompliant,
                      "Non-Compliant": complianceSummary.rohsNonCompliant,
                    },
                    {
                      name: "REACH",
                      Compliant: complianceSummary.reachCompliant,
                      "Non-Compliant": complianceSummary.reachNonCompliant,
                    },
                  ]}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="Compliant"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Non-Compliant"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Error list */}
            {assembly.bom_line_items.some((i) => i.z2data_error) && (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <XCircle className="size-4 text-red-500" />
                      Enrichment Errors
                    </CardTitle>
                    <CardDescription>
                      These parts could not be found in Z2Data
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setResolveOpen(true)}
                  >
                    <Wrench className="size-3.5" />
                    Resolve {assembly.bom_line_items.filter((i) => i.z2data_error).length} Failed
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {assembly.bom_line_items
                      .filter((i) => i.z2data_error)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                        >
                          <span className="font-mono">{item.value}</span>
                          <span className="text-muted-foreground">
                            {item.z2data_error}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enrichment status badge */}
            {isEnrichmentDone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Enrichment {assembly.z2data_enrichment_status} &middot;{" "}
                {assembly.z2data_enriched_count}/{assembly.z2data_total_enrichable} parts
              </div>
            )}
          </TabsContent>
        )}
        {/* ---- DigiKey Pricing Tab ---- */}
        {hasPricing && (
          <TabsContent value="pricing" className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <DollarSign className="size-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total BOM Cost</p>
                      <p className="text-2xl font-bold">
                        {pricingSummary.totalBomCost.toFixed(2)} EUR
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Based on unit price x quantity
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 p-2">
                      <CheckCircle2 className="size-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Parts Priced</p>
                      <p className="text-2xl font-bold">
                        {pricingSummary.pricedCount}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{enrichedItems.length}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-100 p-2">
                      <AlertCircle className="size-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Out of Stock</p>
                      <p className="text-2xl font-bold">{pricingSummary.outOfStockCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 p-2">
                      <ShoppingCart className="size-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pricing Errors</p>
                      <p className="text-2xl font-bold">
                        {assembly.bom_line_items.filter((i) => i.digikey_error).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Priced items list */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">DigiKey Pricing Details</CardTitle>
                <CardDescription>
                  {pricedItems.length} parts with pricing data from DigiKey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 pr-4 font-medium">MPN</th>
                        <th className="pb-2 pr-4 font-medium">DigiKey P/N</th>
                        <th className="pb-2 pr-4 font-medium text-right">Unit Price</th>
                        <th className="pb-2 pr-4 font-medium text-right">Qty</th>
                        <th className="pb-2 pr-4 font-medium text-right">Line Cost</th>
                        <th className="pb-2 pr-4 font-medium text-right">Stock</th>
                        <th className="pb-2 pr-4 font-medium text-right">MOQ</th>
                        <th className="pb-2 font-medium">Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricedItems.map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-mono">{item.value}</td>
                          <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                            {item.digikey_part_number ?? "-"}
                          </td>
                          <td className="py-2 pr-4 text-right font-medium">
                            {item.digikey_unit_price != null
                              ? `${item.digikey_unit_price.toFixed(4)} EUR`
                              : "-"}
                          </td>
                          <td className="py-2 pr-4 text-right">{item.quantity}</td>
                          <td className="py-2 pr-4 text-right font-medium">
                            {item.digikey_unit_price != null
                              ? `${(item.digikey_unit_price * item.quantity).toFixed(2)} EUR`
                              : "-"}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            <span
                              className={
                                item.digikey_stock === 0
                                  ? "text-red-600 font-medium"
                                  : "text-emerald-600"
                              }
                            >
                              {item.digikey_stock?.toLocaleString() ?? "-"}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-right">{item.digikey_moq ?? "-"}</td>
                          <td className="py-2">
                            {item.digikey_product_url ? (
                              <a
                                href={item.digikey_product_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                Buy <ExternalLink className="size-3" />
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td className="pt-2" colSpan={4}>Total BOM Cost</td>
                        <td className="pt-2 text-right">
                          {pricingSummary.totalBomCost.toFixed(2)} EUR
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pricing status badge */}
            {isPricingDone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-blue-500" />
                DigiKey pricing {assembly.digikey_enrichment_status} &middot;{" "}
                {assembly.digikey_enriched_count}/{assembly.digikey_total_enrichable} parts
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Resolve failed parts dialog */}
      {assembly && (
        <ResolveDialog
          open={resolveOpen}
          onOpenChange={setResolveOpen}
          assemblyId={id}
          failedItems={assembly.bom_line_items.filter(
            (i) => i.z2data_error !== null
          )}
          onResolved={handlePartResolved}
        />
      )}
    </div>
  );
}
