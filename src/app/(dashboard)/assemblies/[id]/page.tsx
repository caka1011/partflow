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
  Clock,
  Globe,
} from "lucide-react";

import { KpiCard } from "@/components/layout/kpi-card";
import { DataTable } from "@/components/data-table/data-table";
import { ChartContainer } from "@/components/charts/chart-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
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
            <DetailField label="China RoHS" value={item.z2data_china_rohs} />
            <DetailField label="TSCA" value={item.z2data_tsca} />
            <DetailField label="CA Prop 65" value={item.z2data_ca_prop65} />
            <DetailField label="SCIP ID" value={item.z2data_scip_id} />
            <DetailField label="Lead Free" value={item.z2data_lead_free_status} />
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
// Mock geo-risk data for Analysis tab
// ---------------------------------------------------------------------------

const geoRiskData = [
  { country: "China", parts: 18 },
  { country: "USA", parts: 12 },
  { country: "EU", parts: 8 },
  { country: "Taiwan", parts: 5 },
  { country: "Others", parts: 3 },
];

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

  // BOM filter state
  const [showMatchedOnly, setShowMatchedOnly] = useState(false);
  const [showManuallyChanged, setShowManuallyChanged] = useState(false);

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

  // BOM filtered data
  const filteredBomItems = useMemo(() => {
    if (!assembly) return [];
    let items = assembly.bom_line_items;
    if (showMatchedOnly) {
      items = items.filter((i) => i.z2data_enriched_at);
    }
    if (showManuallyChanged) {
      // Show items that were resolved (had error then got enriched)
      items = items.filter((i) => i.z2data_enriched_at && i.z2data_part_id);
    }
    return items;
  }, [assembly, showMatchedOnly, showManuallyChanged]);

  const unmatchedItems = useMemo(() => {
    if (!assembly) return [];
    return assembly.bom_line_items.filter((i) => i.z2data_error);
  }, [assembly]);

  // Compliance data with EAR/ITAR mock
  const complianceChartData = useMemo(() => {
    return [
      {
        name: "RoHS",
        Compliant: complianceSummary.rohsCompliant || 6,
        "Non-Compliant": complianceSummary.rohsNonCompliant || 2,
      },
      {
        name: "REACH",
        Compliant: complianceSummary.reachCompliant || 5,
        "Non-Compliant": complianceSummary.reachNonCompliant || 3,
      },
      {
        name: "EAR",
        Compliant: 7,
        "Non-Compliant": 1,
      },
      {
        name: "ITAR",
        Compliant: 6,
        "Non-Compliant": 2,
      },
    ];
  }, [complianceSummary]);

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
          <Link href="/assemblies">Back to Projects</Link>
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
          Back to Projects
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
              ) : (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleFetchPricing}
                  disabled={pricingLoading || enriching}
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
      {/* 2. Tabs: BOM Lines | Analysis                                     */}
      {/* ----------------------------------------------------------------- */}
      <Tabs defaultValue="bom" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bom">BOM Lines</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        {/* ---- BOM Lines Tab ---- */}
        <TabsContent value="bom" className="space-y-4">
          {/* Filter checkboxes */}
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={showMatchedOnly}
                onCheckedChange={(v) => setShowMatchedOnly(v === true)}
              />
              Matched
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={showManuallyChanged}
                onCheckedChange={(v) => setShowManuallyChanged(v === true)}
              />
              Manually Changed
            </label>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bill of Materials</CardTitle>
              <CardDescription>
                {filteredBomItems.length} line items
                {hasEnrichment && (
                  <> &middot; {enrichedItems.length} enriched with Z2Data</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={bomColumns}
                data={filteredBomItems}
                searchKey="shorttext"
                searchPlaceholder="Search components..."
                renderExpandedRow={(item) => <BomExpandedRow item={item} />}
              />
            </CardContent>
          </Card>

          {/* Unmatched parts section */}
          {unmatchedItems.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <XCircle className="size-4 text-red-500" />
                    Unmatched Parts
                  </CardTitle>
                  <CardDescription>
                    {unmatchedItems.length} parts could not be matched
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {unmatchedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <div className="flex-1">
                        <span className="font-mono font-medium">{item.value}</span>
                        <span className="ml-3 text-muted-foreground text-xs">
                          {item.z2data_error}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setResolveOpen(true)}
                      >
                        <Wrench className="size-3.5" />
                        Resolve
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ---- Analysis Tab ---- */}
        <TabsContent value="analysis" className="space-y-6">
          {/* KPI blocks */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              title="Total Cost"
              value={
                pricingSummary.totalBomCost > 0
                  ? `${pricingSummary.totalBomCost.toFixed(2)} EUR`
                  : "—"
              }
              icon={DollarSign}
            />
          </div>

          {/* Charts row 1: Lifecycle + Compliance */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartContainer
              title="Lifecycle Distribution"
              subtitle="Part lifecycle status breakdown"
              height={300}
            >
              <PieChart>
                <Pie
                  data={
                    lifecycleDistribution.length > 0
                      ? lifecycleDistribution
                      : [
                          { name: "Active", value: 15 },
                          { name: "NRND", value: 4 },
                          { name: "Obsolete", value: 3 },
                          { name: "EOL", value: 2 },
                        ]
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {(lifecycleDistribution.length > 0
                    ? lifecycleDistribution
                    : [
                        { name: "Active", value: 15 },
                        { name: "NRND", value: 4 },
                        { name: "Obsolete", value: 3 },
                        { name: "EOL", value: 2 },
                      ]
                  ).map((entry) => {
                    const s = entry.name.toLowerCase();
                    let fill = "#3b82f6";
                    if (s === "active" || s === "production") fill = "#10b981";
                    else if (s === "nrnd" || s === "not recommended")
                      fill = "#f59e0b";
                    else if (s === "eol" || s === "end of life")
                      fill = "#f97316";
                    else if (s === "obsolete") fill = "#ef4444";
                    return <Cell key={`lc-${entry.name}`} fill={fill} />;
                  })}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ChartContainer>

            <ChartContainer
              title="Compliance Summary"
              subtitle="RoHS, REACH, EAR & ITAR compliance"
              height={300}
            >
              <BarChart data={complianceChartData}>
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
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Non-Compliant"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>

          {/* Charts row 2: Geo-Risk + Lead Time & Pricing */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartContainer
              title="Geo-Risk"
              subtitle="Parts by country/region of origin"
              height={300}
            >
              <BarChart data={geoRiskData}>
                <XAxis
                  dataKey="country"
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
                <Bar
                  dataKey="parts"
                  name="Parts"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>

            <Card className="gap-0 py-0">
              <CardHeader>
                <CardTitle className="text-base">Lead Time & Pricing</CardTitle>
                <CardDescription>Aggregate metrics across all parts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pb-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-blue-50">
                    <Clock className="size-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Lead Time</p>
                    <p className="text-2xl font-bold">8.2 wks</p>
                    <p className="text-xs text-muted-foreground">across all parts</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-emerald-50">
                    <DollarSign className="size-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Material Cost</p>
                    <p className="text-2xl font-bold">
                      {pricingSummary.totalBomCost > 0
                        ? `${pricingSummary.totalBomCost.toFixed(2)} EUR`
                        : "500 Riyal"}
                    </p>
                    <p className="text-xs text-muted-foreground">total BOM cost estimate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enrichment Errors */}
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
        </TabsContent>
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
