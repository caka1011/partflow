"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
} from "lucide-react";

import { KpiCard } from "@/components/layout/kpi-card";
import { DataTable } from "@/components/data-table/data-table";
import { ChartContainer } from "@/components/charts/chart-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { getAssembly, deleteAssembly } from "@/lib/actions/assemblies";
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
// BOM line item table columns
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
        </TabsList>

        {/* ---- BOM Lines Tab ---- */}
        <TabsContent value="bom">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bill of Materials</CardTitle>
              <CardDescription>
                {assembly.bom_line_items.length} line items across{" "}
                {sections.length} sections
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
      </Tabs>
    </div>
  );
}
