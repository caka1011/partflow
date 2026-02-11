"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  BarChart3,
  Package,
  Truck,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

import { KpiCard } from "@/components/layout/kpi-card";
import { DataTable } from "@/components/data-table/data-table";
import { ChartContainer } from "@/components/charts/chart-container";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GapRow {
  id: string;
  month: string;
  site: string;
  demand: number;
  available_inventory: number;
  on_order: number;
  total_supply: number;
  gap: number;
  status: "OK" | "Warning" | "Critical" | "Surplus";
}

interface MonthlyDemandBySite {
  month: string;
  Shenzhen: number;
  Munich: number;
  Austin: number;
  Penang: number;
}

interface RecommendedAction {
  id: string;
  problem: string;
  recommendation: string;
  priority: "Critical" | "High" | "Medium";
  site: string;
  month: string;
}

// ---------------------------------------------------------------------------
// Mock data — Monthly demand by production site (stacked bar chart)
// ---------------------------------------------------------------------------

const monthlyDemandData: MonthlyDemandBySite[] = [
  { month: "Jan 2025", Shenzhen: 1200, Munich: 600, Austin: 400, Penang: 300 },
  { month: "Feb 2025", Shenzhen: 1400, Munich: 650, Austin: 500, Penang: 350 },
  { month: "Mar 2025", Shenzhen: 1800, Munich: 800, Austin: 600, Penang: 500 },
  { month: "Apr 2025", Shenzhen: 1500, Munich: 700, Austin: 550, Penang: 400 },
  { month: "May 2025", Shenzhen: 1300, Munich: 750, Austin: 450, Penang: 350 },
  { month: "Jun 2025", Shenzhen: 1100, Munich: 600, Austin: 350, Penang: 300 },
];

const SITE_COLORS: Record<string, string> = {
  Shenzhen: "#3b82f6",
  Munich: "#10b981",
  Austin: "#f59e0b",
  Penang: "#8b5cf6",
};

// ---------------------------------------------------------------------------
// Mock data — Supply vs Demand Gap Analysis (24 rows: 6 months x 4 sites)
// ---------------------------------------------------------------------------

const sites = ["Shenzhen", "Munich", "Austin", "Penang"] as const;
const months = [
  "Jan 2025",
  "Feb 2025",
  "Mar 2025",
  "Apr 2025",
  "May 2025",
  "Jun 2025",
] as const;

function buildGapRows(): GapRow[] {
  const demandMap: Record<string, Record<string, number>> = {
    "Jan 2025": { Shenzhen: 1200, Munich: 600, Austin: 400, Penang: 300 },
    "Feb 2025": { Shenzhen: 1400, Munich: 650, Austin: 500, Penang: 350 },
    "Mar 2025": { Shenzhen: 1800, Munich: 800, Austin: 600, Penang: 500 },
    "Apr 2025": { Shenzhen: 1500, Munich: 700, Austin: 550, Penang: 400 },
    "May 2025": { Shenzhen: 1300, Munich: 750, Austin: 450, Penang: 350 },
    "Jun 2025": { Shenzhen: 1100, Munich: 600, Austin: 350, Penang: 300 },
  };

  const inventoryMap: Record<string, Record<string, number>> = {
    "Jan 2025": { Shenzhen: 800, Munich: 400, Austin: 300, Penang: 200 },
    "Feb 2025": { Shenzhen: 700, Munich: 350, Austin: 250, Penang: 180 },
    "Mar 2025": { Shenzhen: 500, Munich: 200, Austin: 150, Penang: 100 },
    "Apr 2025": { Shenzhen: 900, Munich: 500, Austin: 400, Penang: 300 },
    "May 2025": { Shenzhen: 1000, Munich: 600, Austin: 350, Penang: 280 },
    "Jun 2025": { Shenzhen: 850, Munich: 500, Austin: 300, Penang: 250 },
  };

  const onOrderMap: Record<string, Record<string, number>> = {
    "Jan 2025": { Shenzhen: 500, Munich: 300, Austin: 200, Penang: 150 },
    "Feb 2025": { Shenzhen: 600, Munich: 350, Austin: 200, Penang: 100 },
    "Mar 2025": { Shenzhen: 400, Munich: 200, Austin: 100, Penang: 50 },
    "Apr 2025": { Shenzhen: 700, Munich: 300, Austin: 250, Penang: 200 },
    "May 2025": { Shenzhen: 400, Munich: 200, Austin: 150, Penang: 100 },
    "Jun 2025": { Shenzhen: 350, Munich: 200, Austin: 100, Penang: 80 },
  };

  const rows: GapRow[] = [];
  let idx = 0;

  for (const month of months) {
    for (const site of sites) {
      const demand = demandMap[month][site];
      const inv = inventoryMap[month][site];
      const onOrder = onOrderMap[month][site];
      const totalSupply = inv + onOrder;
      const gap = totalSupply - demand;

      let status: GapRow["status"];
      if (gap >= 200) status = "Surplus";
      else if (gap >= 0) status = "OK";
      else if (gap >= -200) status = "Warning";
      else status = "Critical";

      rows.push({
        id: `gap-${idx++}`,
        month,
        site,
        demand,
        available_inventory: inv,
        on_order: onOrder,
        total_supply: totalSupply,
        gap,
        status,
      });
    }
  }

  return rows;
}

const gapRows = buildGapRows();

// ---------------------------------------------------------------------------
// Mock data — Recommended actions
// ---------------------------------------------------------------------------

const recommendedActions: RecommendedAction[] = [
  {
    id: "ra-1",
    problem:
      "Shenzhen faces a 900-unit shortfall in March 2025 due to surging demand and low on-order quantities.",
    recommendation:
      "Place an expedited PO for 1,000 units with STMicroelectronics Shenzhen warehouse. Request air freight to meet production schedule.",
    priority: "Critical",
    site: "Shenzhen",
    month: "Mar 2025",
  },
  {
    id: "ra-2",
    problem:
      "Penang production site shows a 350-unit deficit in March 2025 with only 100 units in inventory and 50 on order.",
    recommendation:
      "Redirect 400 units from Austin surplus inventory (Apr 2025) via inter-site transfer. Lead time: 2 weeks.",
    priority: "Critical",
    site: "Penang",
    month: "Mar 2025",
  },
  {
    id: "ra-3",
    problem:
      "Munich shows a 250-unit gap in February 2025 with limited buffer stock.",
    recommendation:
      "Increase February on-order by 300 units from Mouser (4-week lead time). Adjust safety stock threshold from 200 to 350 units.",
    priority: "High",
    site: "Munich",
    month: "Feb 2025",
  },
  {
    id: "ra-4",
    problem:
      "Austin demand in March 2025 exceeds supply by 350 units. Current inventory at 150 units with only 100 on order.",
    recommendation:
      "Source from Arrow Electronics (3,200 units in stock, 8-week lead time). Place PO for 500 units to cover March and build buffer.",
    priority: "High",
    site: "Austin",
    month: "Mar 2025",
  },
];

// ---------------------------------------------------------------------------
// Derived chart data
// ---------------------------------------------------------------------------

// Site performance pie (total demand by site)
const sitePerformanceData = sites.map((site) => ({
  name: site,
  value: gapRows
    .filter((r) => r.site === site)
    .reduce((sum, r) => sum + r.demand, 0),
}));

// Supply coverage line chart (total supply vs total demand per month)
const supplyCoverageData = months.map((month) => {
  const monthRows = gapRows.filter((r) => r.month === month);
  return {
    month: month.replace(" 2025", ""),
    demand: monthRows.reduce((s, r) => s + r.demand, 0),
    supply: monthRows.reduce((s, r) => s + r.total_supply, 0),
  };
});

// Gap severity pie (counts of each status)
const statusCounts = { OK: 0, Warning: 0, Critical: 0, Surplus: 0 };
for (const row of gapRows) {
  statusCounts[row.status]++;
}
const gapSeverityData = [
  { name: "OK", value: statusCounts.OK },
  { name: "Warning", value: statusCounts.Warning },
  { name: "Critical", value: statusCounts.Critical },
  { name: "Surplus", value: statusCounts.Surplus },
];

const GAP_SEVERITY_COLORS: Record<string, string> = {
  OK: "#10b981",
  Warning: "#f59e0b",
  Critical: "#ef4444",
  Surplus: "#3b82f6",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function getStatusBadgeClasses(status: GapRow["status"]): string {
  switch (status) {
    case "OK":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Warning":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Critical":
      return "bg-red-100 text-red-700 border-red-200";
    case "Surplus":
      return "bg-blue-100 text-blue-700 border-blue-200";
  }
}

function getPriorityBadgeClasses(
  priority: RecommendedAction["priority"]
): string {
  switch (priority) {
    case "Critical":
      return "bg-red-100 text-red-700 border-red-200";
    case "High":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Medium":
      return "bg-blue-100 text-blue-700 border-blue-200";
  }
}

// ---------------------------------------------------------------------------
// Table columns
// ---------------------------------------------------------------------------

const gapColumns: ColumnDef<GapRow>[] = [
  {
    accessorKey: "month",
    header: "Month",
    cell: ({ row }) => (
      <span className="font-medium whitespace-nowrap">
        {row.original.month}
      </span>
    ),
  },
  {
    accessorKey: "site",
    header: "Production Site",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: SITE_COLORS[row.original.site] }}
        />
        <span>{row.original.site}</span>
      </div>
    ),
  },
  {
    accessorKey: "demand",
    header: "Demand",
    cell: ({ row }) => (
      <span className="tabular-nums">{formatNumber(row.original.demand)}</span>
    ),
  },
  {
    accessorKey: "available_inventory",
    header: "Available Inv.",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatNumber(row.original.available_inventory)}
      </span>
    ),
  },
  {
    accessorKey: "on_order",
    header: "On-Order",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatNumber(row.original.on_order)}
      </span>
    ),
  },
  {
    accessorKey: "total_supply",
    header: "Total Supply",
    cell: ({ row }) => (
      <span className="tabular-nums font-medium">
        {formatNumber(row.original.total_supply)}
      </span>
    ),
  },
  {
    accessorKey: "gap",
    header: "Gap",
    cell: ({ row }) => {
      const gap = row.original.gap;
      return (
        <span
          className={`tabular-nums font-semibold ${
            gap > 0
              ? "text-emerald-600"
              : gap < 0
                ? "text-red-600"
                : "text-muted-foreground"
          }`}
        >
          {gap > 0 ? "+" : ""}
          {formatNumber(gap)}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={getStatusBadgeClasses(row.original.status)}
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Button
        variant="outline"
        size="xs"
        disabled={row.original.status === "OK" || row.original.status === "Surplus"}
      >
        Resolve
      </Button>
    ),
    enableSorting: false,
  },
];

// ---------------------------------------------------------------------------
// Parts for selector
// ---------------------------------------------------------------------------

const availableParts = [
  { value: "STM32F407VGT6", label: "STM32F407VGT6" },
  { value: "TPS54620RGYR", label: "TPS54620RGYR" },
  { value: "ESP32-WROOM-32D", label: "ESP32-WROOM-32D" },
  { value: "NRF52840-QIAA-R7", label: "NRF52840-QIAA-R7" },
  { value: "LM358DR", label: "LM358DR" },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function DemandPlanningPage() {
  const [selectedPart, setSelectedPart] = useState("STM32F407VGT6");
  const [viewMode, setViewMode] = useState<"part" | "site">("part");

  return (
    <div className="space-y-8">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Header + KPI cards                                             */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Demand Planning</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Forecast demand, monitor supply coverage, and resolve gaps across
          production sites
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          title="Total Demand"
          value="15,400"
          subtitle="Next 6 months"
          trend={{ value: 8, positive: true }}
          icon={BarChart3}
        />
        <KpiCard
          title="Available Inventory"
          value="9,200"
          subtitle="Current stock across all sites"
          icon={Package}
        />
        <KpiCard
          title="On-Order Qty"
          value="4,800"
          subtitle="Open purchase orders"
          icon={Truck}
        />
        <KpiCard
          title="Gross Demand"
          value="15,400"
          subtitle="Before netting"
          icon={TrendingUp}
        />
        <KpiCard
          title="Factory Lead Time"
          value="8 wks"
          subtitle="Avg across suppliers"
          icon={Clock}
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Part selector + view toggle                                    */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Part:
          </span>
          <Select value={selectedPart} onValueChange={setSelectedPart}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select part" />
            </SelectTrigger>
            <SelectContent>
              {availableParts.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={viewMode === "part" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("part")}
          >
            Part-Level
          </Button>
          <Button
            variant={viewMode === "site" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("site")}
          >
            Site-Level
          </Button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Monthly Demand by Production Site — stacked bar chart          */}
      {/* ----------------------------------------------------------------- */}
      <ChartContainer
        title="Monthly Demand by Production Site"
        subtitle={`Stacked demand forecast for ${selectedPart} across 4 production sites`}
        height={360}
      >
        <BarChart
          data={monthlyDemandData}
          margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatNumber(v)}
          />
          <Tooltip
            formatter={(value, name) => [
              formatNumber(Number(value ?? 0)),
              String(name ?? ""),
            ]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-muted-foreground">{value}</span>
            )}
          />
          <Bar
            dataKey="Shenzhen"
            stackId="sites"
            fill={SITE_COLORS.Shenzhen}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="Munich"
            stackId="sites"
            fill={SITE_COLORS.Munich}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="Austin"
            stackId="sites"
            fill={SITE_COLORS.Austin}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="Penang"
            stackId="sites"
            fill={SITE_COLORS.Penang}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Summary stats row                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="gap-0 py-0">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Demand</p>
              <p className="text-2xl font-bold tracking-tight">15,400</p>
              <p className="text-xs text-muted-foreground">units over 6 months</p>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Peak Month</p>
              <p className="text-2xl font-bold tracking-tight">March 2025</p>
              <p className="text-xs text-muted-foreground">3,700 units demanded</p>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Growth Rate</p>
              <p className="text-2xl font-bold tracking-tight">+8.2%</p>
              <p className="text-xs text-muted-foreground">month-over-month average</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 5. Supply vs Demand Gap Analysis table                            */}
      {/* ----------------------------------------------------------------- */}
      <Card className="gap-0 py-0">
        <CardHeader className="pb-4 pt-5">
          <CardTitle className="text-base">
            Supply vs Demand Gap Analysis
          </CardTitle>
          <CardDescription>
            Monthly breakdown by production site. Rows with negative gaps are
            highlighted in red.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-5">
          <DataTable
            columns={gapColumns}
            data={gapRows}
            searchKey="site"
            searchPlaceholder="Search by production site..."
          />
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 6. Recommended Actions                                            */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Recommended Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {recommendedActions.map((action) => (
            <Card key={action.id} className="gap-0 py-0">
              <CardHeader className="pb-2 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <AlertTriangle className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">
                        {action.site} &mdash; {action.month}
                      </CardTitle>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={getPriorityBadgeClasses(action.priority)}
                  >
                    {action.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-5">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Problem
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">
                      {action.problem}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Recommended Action
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">
                      {action.recommendation}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm">
                      <CheckCircle className="size-3.5" />
                      Execute
                    </Button>
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 7. Bottom charts row                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Site Performance — donut */}
        <ChartContainer
          title="Site Performance"
          subtitle="Total demand by production site"
          height={280}
        >
          <PieChart>
            <Pie
              data={sitePerformanceData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              label={({ name, value }) => `${name}: ${formatNumber(value)}`}
              labelLine={false}
              fontSize={11}
            >
              {sitePerformanceData.map((entry) => (
                <Cell
                  key={`site-${entry.name}`}
                  fill={SITE_COLORS[entry.name]}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [formatNumber(Number(value ?? 0)), "Demand"]}
            />
            <Legend
              verticalAlign="bottom"
              height={30}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ChartContainer>

        {/* Supply Coverage — line chart */}
        <ChartContainer
          title="Supply Coverage"
          subtitle="Total supply vs total demand over 6 months"
          height={280}
        >
          <LineChart
            data={supplyCoverageData}
            margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatNumber(v)}
            />
            <Tooltip
              formatter={(value, name) => [
                formatNumber(Number(value ?? 0)),
                name === "demand" ? "Demand" : "Supply",
              ]}
            />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">
                  {value === "demand" ? "Demand" : "Supply"}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="demand"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="supply"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>

        {/* Gap Severity — donut */}
        <ChartContainer
          title="Gap Severity"
          subtitle="Distribution of OK, Warning, Critical, and Surplus"
          height={280}
        >
          <PieChart>
            <Pie
              data={gapSeverityData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              label={({ name, value }) => `${name}: ${value}`}
              labelLine={false}
              fontSize={11}
            >
              {gapSeverityData.map((entry) => (
                <Cell
                  key={`sev-${entry.name}`}
                  fill={GAP_SEVERITY_COLORS[entry.name]}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              verticalAlign="bottom"
              height={30}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ChartContainer>
      </div>
    </div>
  );
}
