"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Eye,
  Clock,
  AlertTriangle,
  TrendingUp,
  Shield,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle,
  Info,
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

interface MonitoredPart {
  id: string;
  mpn: string;
  manufacturer: string;
  lead_time: number;
  lead_time_prev: number;
  stock_level: number;
  stock_max: number;
  trend: "increasing" | "stable" | "decreasing";
  price_change: number;
  current_price: number;
}

interface ChartDataPoint {
  month: string;
  leadTime: number;
  stockLevel: number;
}

interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  part: string;
  timestamp: string;
}

interface ManufacturerPerformance {
  name: string;
  avgLeadTime: string;
  stockHealth: "Healthy" | "Warning" | "Critical";
  priceTrend: string;
  partsMonitored: number;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const chartData: ChartDataPoint[] = [
  { month: "Jul", leadTime: 6, stockLevel: 15000 },
  { month: "Aug", leadTime: 7, stockLevel: 13500 },
  { month: "Sep", leadTime: 7, stockLevel: 12000 },
  { month: "Oct", leadTime: 8, stockLevel: 10500 },
  { month: "Nov", leadTime: 8, stockLevel: 9000 },
  { month: "Dec", leadTime: 9, stockLevel: 8500 },
];

const monitoredParts: MonitoredPart[] = [
  {
    id: "mp-001",
    mpn: "STM32F407VGT6",
    manufacturer: "STMicroelectronics",
    lead_time: 9,
    lead_time_prev: 6,
    stock_level: 8500,
    stock_max: 20000,
    trend: "increasing",
    price_change: 5.2,
    current_price: 3.87,
  },
  {
    id: "mp-002",
    mpn: "TPS54620RGYR",
    manufacturer: "Texas Instruments",
    lead_time: 6,
    lead_time_prev: 5,
    stock_level: 14200,
    stock_max: 20000,
    trend: "increasing",
    price_change: 2.1,
    current_price: 2.45,
  },
  {
    id: "mp-003",
    mpn: "ESP32-WROOM-32D",
    manufacturer: "Espressif",
    lead_time: 10,
    lead_time_prev: 8,
    stock_level: 4300,
    stock_max: 20000,
    trend: "increasing",
    price_change: 12.0,
    current_price: 3.10,
  },
  {
    id: "mp-004",
    mpn: "NRF52840-QIAA-R7",
    manufacturer: "Nordic Semiconductor",
    lead_time: 14,
    lead_time_prev: 12,
    stock_level: 2100,
    stock_max: 20000,
    trend: "increasing",
    price_change: 8.5,
    current_price: 4.92,
  },
  {
    id: "mp-005",
    mpn: "LM358DR",
    manufacturer: "Texas Instruments",
    lead_time: 4,
    lead_time_prev: 4,
    stock_level: 25000,
    stock_max: 30000,
    trend: "stable",
    price_change: 0.3,
    current_price: 0.42,
  },
  {
    id: "mp-006",
    mpn: "W25Q128JVSIQ",
    manufacturer: "Winbond",
    lead_time: 7,
    lead_time_prev: 8,
    stock_level: 15000,
    stock_max: 20000,
    trend: "decreasing",
    price_change: -2.1,
    current_price: 1.85,
  },
  {
    id: "mp-007",
    mpn: "IRLML6344TRPBF",
    manufacturer: "Infineon",
    lead_time: 5,
    lead_time_prev: 5,
    stock_level: 35000,
    stock_max: 40000,
    trend: "stable",
    price_change: -0.5,
    current_price: 0.38,
  },
  {
    id: "mp-008",
    mpn: "BQ24195RGER",
    manufacturer: "Texas Instruments",
    lead_time: 8,
    lead_time_prev: 7,
    stock_level: 7800,
    stock_max: 15000,
    trend: "increasing",
    price_change: 3.7,
    current_price: 2.95,
  },
  {
    id: "mp-009",
    mpn: "ADS1115IDGSR",
    manufacturer: "Texas Instruments",
    lead_time: 6,
    lead_time_prev: 6,
    stock_level: 3200,
    stock_max: 10000,
    trend: "stable",
    price_change: 1.2,
    current_price: 5.60,
  },
  {
    id: "mp-010",
    mpn: "AD8232ACPZ",
    manufacturer: "Analog Devices",
    lead_time: 5,
    lead_time_prev: 6,
    stock_level: 2400,
    stock_max: 8000,
    trend: "decreasing",
    price_change: -1.8,
    current_price: 7.25,
  },
];

const alerts: AlertItem[] = [
  {
    id: "al-001",
    title: "Critical Lead Time Increase: NRF52840-QIAA-R7",
    description:
      "Lead time has increased by 17% over the past 3 months, now at 14 weeks. Multiple distributors reporting allocation constraints.",
    severity: "critical",
    part: "NRF52840-QIAA-R7",
    timestamp: "2 hours ago",
  },
  {
    id: "al-002",
    title: "Stock Below Threshold: ESP32-WROOM-32D",
    description:
      "Distributor stock has fallen below 5,000 units across all channels. Consider placing buffer orders.",
    severity: "critical",
    part: "ESP32-WROOM-32D",
    timestamp: "5 hours ago",
  },
  {
    id: "al-003",
    title: "Price Spike Detected: ESP32-WROOM-32D",
    description:
      "Unit price increased 12% month-over-month, the highest change across all monitored parts. Evaluate alternative sources.",
    severity: "warning",
    part: "ESP32-WROOM-32D",
    timestamp: "1 day ago",
  },
  {
    id: "al-004",
    title: "Lead Time Improvement: AD8232ACPZ",
    description:
      "Lead time decreased from 6 weeks to 5 weeks. Stock levels improving. Consider this window for replenishment.",
    severity: "info",
    part: "AD8232ACPZ",
    timestamp: "1 day ago",
  },
  {
    id: "al-005",
    title: "Supply Constraint Warning: STM32F407VGT6",
    description:
      "STMicroelectronics has issued a supply advisory for the STM32F4 family. Lead times may extend further in Q1 2025.",
    severity: "warning",
    part: "STM32F407VGT6",
    timestamp: "3 days ago",
  },
];

const manufacturerPerformance: ManufacturerPerformance[] = [
  {
    name: "STMicroelectronics",
    avgLeadTime: "9.0 wks",
    stockHealth: "Warning",
    priceTrend: "+5.2%",
    partsMonitored: 2,
  },
  {
    name: "Texas Instruments",
    avgLeadTime: "6.0 wks",
    stockHealth: "Healthy",
    priceTrend: "+1.8%",
    partsMonitored: 4,
  },
  {
    name: "Espressif",
    avgLeadTime: "10.0 wks",
    stockHealth: "Critical",
    priceTrend: "+12.0%",
    partsMonitored: 1,
  },
  {
    name: "Nordic Semiconductor",
    avgLeadTime: "14.0 wks",
    stockHealth: "Critical",
    priceTrend: "+8.5%",
    partsMonitored: 1,
  },
  {
    name: "Winbond",
    avgLeadTime: "7.0 wks",
    stockHealth: "Healthy",
    priceTrend: "-2.1%",
    partsMonitored: 1,
  },
  {
    name: "Infineon",
    avgLeadTime: "5.0 wks",
    stockHealth: "Healthy",
    priceTrend: "-0.5%",
    partsMonitored: 1,
  },
  {
    name: "Analog Devices",
    avgLeadTime: "5.0 wks",
    stockHealth: "Warning",
    priceTrend: "-1.8%",
    partsMonitored: 1,
  },
];

// ---------------------------------------------------------------------------
// Part options for filter dropdown
// ---------------------------------------------------------------------------

const partOptions = monitoredParts.map((p) => ({
  value: p.mpn,
  label: p.mpn,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function getTrendBadge(trend: MonitoredPart["trend"]) {
  switch (trend) {
    case "increasing":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
          <ArrowUp className="size-3" />
          Increasing
        </Badge>
      );
    case "decreasing":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
          <ArrowDown className="size-3" />
          Decreasing
        </Badge>
      );
    case "stable":
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
          <Minus className="size-3" />
          Stable
        </Badge>
      );
  }
}

function getStockBarColor(ratio: number): string {
  if (ratio > 0.6) return "bg-emerald-500";
  if (ratio > 0.3) return "bg-amber-500";
  return "bg-red-500";
}

function getStockHealthClasses(health: ManufacturerPerformance["stockHealth"]): string {
  switch (health) {
    case "Healthy":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Warning":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Critical":
      return "bg-red-100 text-red-700 border-red-200";
  }
}

function getSeverityBadgeClasses(severity: AlertItem["severity"]): string {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-700 border-red-200";
    case "warning":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "info":
      return "bg-blue-100 text-blue-700 border-blue-200";
  }
}

function getSeverityIcon(severity: AlertItem["severity"]) {
  switch (severity) {
    case "critical":
      return <AlertCircle className="size-4 text-red-600" />;
    case "warning":
      return <AlertTriangle className="size-4 text-amber-600" />;
    case "info":
      return <Info className="size-4 text-blue-600" />;
  }
}

// ---------------------------------------------------------------------------
// Table columns
// ---------------------------------------------------------------------------

const columns: ColumnDef<MonitoredPart>[] = [
  {
    accessorKey: "mpn",
    header: "Part Number",
    cell: ({ row }) => (
      <span className="font-semibold text-sm">{row.original.mpn}</span>
    ),
  },
  {
    accessorKey: "manufacturer",
    header: "Manufacturer",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.manufacturer}</span>
    ),
  },
  {
    accessorKey: "lead_time",
    header: "Lead Time",
    cell: ({ row }) => {
      const current = row.original.lead_time;
      const prev = row.original.lead_time_prev;
      const diff = current - prev;
      return (
        <div className="flex items-center gap-1.5">
          <span className="text-sm tabular-nums">{current} wks</span>
          {diff > 0 && (
            <span className="flex items-center text-xs text-red-600">
              <ArrowUp className="size-3" />
              {diff}
            </span>
          )}
          {diff < 0 && (
            <span className="flex items-center text-xs text-emerald-600">
              <ArrowDown className="size-3" />
              {Math.abs(diff)}
            </span>
          )}
          {diff === 0 && (
            <span className="flex items-center text-xs text-muted-foreground">
              <Minus className="size-3" />
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "stock_level",
    header: "Stock Level",
    cell: ({ row }) => {
      const ratio = row.original.stock_level / row.original.stock_max;
      return (
        <div className="flex items-center gap-2 min-w-[140px]">
          <div className="relative h-2 w-20 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`absolute inset-y-0 left-0 rounded-full ${getStockBarColor(ratio)}`}
              style={{ width: `${Math.min(ratio * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs tabular-nums">
            {formatNumber(row.original.stock_level)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "trend",
    header: "Trend",
    cell: ({ row }) => getTrendBadge(row.original.trend),
  },
  {
    accessorKey: "price_change",
    header: "Price Change %",
    cell: ({ row }) => {
      const change = row.original.price_change;
      return (
        <span
          className={`text-sm font-medium tabular-nums ${
            change > 0 ? "text-red-600" : change < 0 ? "text-emerald-600" : "text-muted-foreground"
          }`}
        >
          {change > 0 ? "+" : ""}
          {change.toFixed(1)}%
        </span>
      );
    },
  },
  {
    accessorKey: "current_price",
    header: "Price",
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        ${row.original.current_price.toFixed(2)}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Button variant="ghost" size="xs">
        <Eye className="size-3.5" />
        Details
      </Button>
    ),
    enableSorting: false,
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function MarketIntelligencePage() {
  const [selectedPart, setSelectedPart] = useState<string>("STM32F407VGT6");
  const [timeRange, setTimeRange] = useState<string>("6M");

  // Derived data for the selected part
  const activePart = monitoredParts.find((p) => p.mpn === selectedPart);

  // Trend distribution
  const trendCounts = {
    increasing: monitoredParts.filter((p) => p.trend === "increasing").length,
    stable: monitoredParts.filter((p) => p.trend === "stable").length,
    decreasing: monitoredParts.filter((p) => p.trend === "decreasing").length,
  };

  // Price change analysis
  const priceChanges = monitoredParts.map((p) => p.price_change);
  const avgPriceChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
  const maxPriceChange = Math.max(...priceChanges);
  const minPriceChange = Math.min(...priceChanges);

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Header + KPI cards                                             */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Market Intelligence
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor supply chain trends, pricing changes, and stock levels across
          your critical components
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          title="Monitored Parts"
          value={20}
          subtitle="Active tracking"
          icon={Eye}
        />
        <KpiCard
          title="Avg Lead Time"
          value="8.2 wks"
          subtitle="Across all parts"
          trend={{ value: 12, positive: false }}
          icon={Clock}
        />
        <KpiCard
          title="Stock Alerts"
          value={4}
          subtitle="Below threshold"
          icon={AlertTriangle}
        />
        <KpiCard
          title="Price Changes"
          value={7}
          subtitle="This month"
          icon={TrendingUp}
        />
        <KpiCard
          title="Risk Score"
          value={32}
          subtitle="Portfolio average"
          icon={Shield}
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Filters                                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Part:
          </span>
          <Select value={selectedPart} onValueChange={setSelectedPart}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select a part" />
            </SelectTrigger>
            <SelectContent>
              {partOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Time Range:
          </span>
          <div className="flex gap-1">
            {["3M", "6M", "1Y"].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Lead Time vs Stock dual-axis chart                             */}
      {/* ----------------------------------------------------------------- */}
      <ChartContainer
        title={`Lead Time vs Stock Level -- ${selectedPart}`}
        subtitle="Jul - Dec 2024 trend analysis"
        height={340}
      >
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "Lead Time (wks)",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11, fill: "#6b7280" },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            label={{
              value: "Stock Level",
              angle: 90,
              position: "insideRight",
              style: { fontSize: 11, fill: "#6b7280" },
            }}
          />
          <Tooltip
            formatter={(value, name) => {
              const v = Number(value ?? 0);
              if (name === "Lead Time") return [`${v} wks`, String(name)];
              return [formatNumber(v), String(name ?? "")];
            }}
          />
          <Legend />
          <Bar
            yAxisId="right"
            dataKey="stockLevel"
            name="Stock Level"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
            opacity={0.7}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="leadTime"
            name="Lead Time"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#3b82f6" }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ChartContainer>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Current metrics row                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="gap-0 py-0">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Current Lead Time</p>
            <p className="mt-1 text-2xl font-bold">
              {activePart?.lead_time ?? 9} wks
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Up from {activePart?.lead_time_prev ?? 6} wks
            </p>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Current Stock</p>
            <p className="mt-1 text-2xl font-bold">
              {formatNumber(activePart?.stock_level ?? 8500)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Across all distributors
            </p>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Trend Direction</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-2xl font-bold text-red-600">
                <ArrowUp className="inline size-5" /> Rising
              </p>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Increasing risk
            </p>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Alert Status</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="size-3 rounded-full bg-amber-500" />
              <p className="text-2xl font-bold text-amber-600">Warning</p>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Requires monitoring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 5. Monitored Parts table                                          */}
      {/* ----------------------------------------------------------------- */}
      <Card className="gap-0 py-0">
        <CardHeader className="pb-4 pt-5">
          <CardTitle className="text-base">Monitored Parts</CardTitle>
          <CardDescription>
            Track lead times, stock levels, and pricing across your critical
            components
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-5">
          <DataTable
            columns={columns}
            data={monitoredParts}
            searchKey="mpn"
            searchPlaceholder="Search part numbers..."
          />
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 6. Summary cards row                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Trend Distribution */}
        <Card className="gap-0 py-0">
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="text-base">Trend Distribution</CardTitle>
            <CardDescription>
              Parts grouped by lead time trend direction
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUp className="size-4 text-red-600" />
                  <span className="text-sm">Increasing</span>
                </div>
                <span className="text-lg font-bold">{trendCounts.increasing}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Minus className="size-4 text-blue-600" />
                  <span className="text-sm">Stable</span>
                </div>
                <span className="text-lg font-bold">{trendCounts.stable}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDown className="size-4 text-emerald-600" />
                  <span className="text-sm">Decreasing</span>
                </div>
                <span className="text-lg font-bold">{trendCounts.decreasing}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Change Analysis */}
        <Card className="gap-0 py-0">
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="text-base">Price Change Analysis</CardTitle>
            <CardDescription>
              Aggregate pricing trends for monitored parts
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average</span>
                <span className="text-lg font-bold text-red-600">
                  +{avgPriceChange.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Maximum</span>
                <span className="text-lg font-bold text-red-600">
                  +{maxPriceChange.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Minimum</span>
                <span className="text-lg font-bold text-emerald-600">
                  {minPriceChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Time Forecast */}
        <Card className="gap-0 py-0">
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="text-base">Lead Time Forecast</CardTitle>
            <CardDescription>
              Predicted lead time for the selected part
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current</span>
                <span className="text-lg font-bold">
                  {activePart?.lead_time ?? 9} wks
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Predicted Next Month
                </span>
                <span className="text-lg font-bold text-red-600">9.5 wks</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Confidence</span>
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  Medium
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 7. Active Alerts                                                  */}
      {/* ----------------------------------------------------------------- */}
      <Card className="gap-0 py-0">
        <CardHeader className="pb-2 pt-5">
          <CardTitle className="text-base">Active Alerts</CardTitle>
          <CardDescription>
            Recent supply chain alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="divide-y">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="mt-0.5 shrink-0">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={getSeverityBadgeClasses(alert.severity)}
                    >
                      {alert.severity}
                    </Badge>
                    <span className="text-sm font-medium">{alert.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {alert.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    {alert.timestamp}
                  </p>
                </div>
                <Button variant="ghost" size="xs" className="shrink-0">
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 8. Manufacturer Performance                                       */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Manufacturer Performance
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {manufacturerPerformance.map((mfr) => (
            <Card key={mfr.name} className="gap-0 py-0">
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="text-base">{mfr.name}</CardTitle>
                <CardDescription>
                  {mfr.partsMonitored} part{mfr.partsMonitored !== 1 ? "s" : ""}{" "}
                  monitored
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-5">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Avg Lead Time
                    </span>
                    <span className="text-sm font-medium">{mfr.avgLeadTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Stock Health
                    </span>
                    <Badge
                      variant="outline"
                      className={getStockHealthClasses(mfr.stockHealth)}
                    >
                      {mfr.stockHealth}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Price Trend
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        mfr.priceTrend.startsWith("+")
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {mfr.priceTrend}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
