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
// BOM line item table columns (with Z2Data enrichment)
// ---------------------------------------------------------------------------

const bomColumns: ColumnDef<BomLineItemRow>[] = [
  {
    accessorKey: "line_number",
    header: "#",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.line_number}</span>
    ),
  },
  {
    accessorKey: "section",
    header: "Section",
    cell: ({ row }) => (
      <Badge className="bg-slate-100 text-slate-600 border-slate-200">
        {row.original.section}
      </Badge>
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
    id: "compliance",
    header: "Compliance",
    cell: ({ row }) => {
      const rohs = row.original.z2data_rohs;
      const reach = row.original.z2data_reach;
      if (!rohs && !reach) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {rohs && (
            <Badge
              className={
                rohs.toLowerCase() === "compliant"
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : "bg-amber-100 text-amber-700 border-amber-200"
              }
            >
              RoHS: {rohs}
            </Badge>
          )}
          {reach && (
            <Badge
              className={
                reach.toLowerCase() === "compliant"
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : "bg-amber-100 text-amber-700 border-amber-200"
              }
            >
              REACH: {reach}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "datasheet",
    header: "Datasheet",
    cell: ({ row }) => {
      const url = row.original.z2data_datasheet_url;
      if (!url) return <span className="text-muted-foreground">-</span>;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          PDF <ExternalLink className="size-3" />
        </a>
      );
    },
  },
  {
    id: "supplier1",
    header: "Supplier 1",
    cell: ({ row }) => {
      const name = row.original.supplier1_name;
      const order = row.original.supplier1_order_number;
      if (!name) return <span className="text-muted-foreground">-</span>;
      return (
        <div>
          <p className="text-sm font-medium">{name}</p>
          {order && (
            <p className="font-mono text-xs text-muted-foreground">{order}</p>
          )}
        </div>
      );
    },
  },
  {
    id: "supplier2",
    header: "Supplier 2",
    cell: ({ row }) => {
      const name = row.original.supplier2_name;
      const order = row.original.supplier2_order_number;
      if (!name) return <span className="text-muted-foreground">-</span>;
      return (
        <div>
          <p className="text-sm font-medium">{name}</p>
          {order && (
            <p className="font-mono text-xs text-muted-foreground">{order}</p>
          )}
        </div>
      );
    },
  },
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
