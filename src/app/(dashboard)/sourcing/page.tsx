"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Building2,
  FileText,
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
  Star,
  Zap,
  BarChart3,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface OfferRow {
  id: string;
  supplier: string;
  authorized: boolean;
  packaging: string;
  moq: number;
  lead_time_weeks: number;
  stock: number;
  unit_price: number;
  origin_country: string;
  last_updated: string;
}

const mockOffers: OfferRow[] = [
  {
    id: "off-1",
    supplier: "Digi-Key",
    authorized: true,
    packaging: "Tape & Reel",
    moq: 1,
    lead_time_weeks: 6,
    stock: 14523,
    unit_price: 3.8742,
    origin_country: "US",
    last_updated: "2026-02-09",
  },
  {
    id: "off-2",
    supplier: "Mouser",
    authorized: true,
    packaging: "Tape & Reel",
    moq: 1,
    lead_time_weeks: 5,
    stock: 8740,
    unit_price: 3.9215,
    origin_country: "US",
    last_updated: "2026-02-10",
  },
  {
    id: "off-3",
    supplier: "Arrow",
    authorized: true,
    packaging: "Tray",
    moq: 250,
    lead_time_weeks: 8,
    stock: 3200,
    unit_price: 3.5100,
    origin_country: "US",
    last_updated: "2026-02-08",
  },
  {
    id: "off-4",
    supplier: "Farnell",
    authorized: true,
    packaging: "Cut Tape",
    moq: 1,
    lead_time_weeks: 7,
    stock: 5610,
    unit_price: 4.1280,
    origin_country: "GB",
    last_updated: "2026-02-07",
  },
  {
    id: "off-5",
    supplier: "RS Components",
    authorized: true,
    packaging: "Tape & Reel",
    moq: 500,
    lead_time_weeks: 9,
    stock: 2100,
    unit_price: 3.6500,
    origin_country: "GB",
    last_updated: "2026-02-06",
  },
  {
    id: "off-6",
    supplier: "LCSC",
    authorized: false,
    packaging: "Tape & Reel",
    moq: 10,
    lead_time_weeks: 12,
    stock: 0,
    unit_price: 2.4500,
    origin_country: "CN",
    last_updated: "2026-02-05",
  },
  {
    id: "off-7",
    supplier: "TME",
    authorized: true,
    packaging: "Cut Tape",
    moq: 1,
    lead_time_weeks: 4,
    stock: 920,
    unit_price: 4.5600,
    origin_country: "PL",
    last_updated: "2026-02-10",
  },
  {
    id: "off-8",
    supplier: "Win Source",
    authorized: false,
    packaging: "Tray",
    moq: 2500,
    lead_time_weeks: 10,
    stock: 15000,
    unit_price: 5.1800,
    origin_country: "HK",
    last_updated: "2026-02-04",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return `$${value.toFixed(4)}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function relativeDate(dateStr: string): string {
  const now = new Date("2026-02-11");
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

// ---------------------------------------------------------------------------
// Table columns
// ---------------------------------------------------------------------------

const columns: ColumnDef<OfferRow>[] = [
  {
    accessorKey: "supplier",
    header: "Supplier",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.supplier}</span>
        {row.original.authorized ? (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            Authorized
          </Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            Broker
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "packaging",
    header: "Packaging",
  },
  {
    accessorKey: "moq",
    header: "MOQ",
    cell: ({ row }) => formatNumber(row.original.moq),
  },
  {
    accessorKey: "lead_time_weeks",
    header: "Lead Time",
    cell: ({ row }) => `${row.original.lead_time_weeks} weeks`,
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.original.stock;
      return (
        <div className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${
              stock > 0 ? "bg-emerald-500" : "bg-red-500"
            }`}
          />
          <span>{formatNumber(stock)}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "unit_price",
    header: "Unit Price",
    cell: ({ row }) => (
      <span className="font-mono">{formatCurrency(row.original.unit_price)}</span>
    ),
  },
  {
    id: "total",
    header: "Total (MOQ)",
    cell: ({ row }) => {
      const total = row.original.moq * row.original.unit_price;
      return <span className="font-mono">{formatCurrency(total)}</span>;
    },
  },
  {
    accessorKey: "origin_country",
    header: "Origin",
  },
  {
    accessorKey: "last_updated",
    header: "Updated",
    cell: ({ row }) => relativeDate(row.original.last_updated),
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <Button size="sm" variant="outline" className="gap-1.5">
        <ShoppingCart className="size-3.5" />
        Add to Cart
      </Button>
    ),
  },
];

// ---------------------------------------------------------------------------
// Chart data
// ---------------------------------------------------------------------------

const priceChartData = mockOffers.map((o) => ({
  supplier: o.supplier,
  price: o.unit_price,
}));

const leadTimeData = [
  { range: "4 wks", count: 1 },
  { range: "5 wks", count: 1 },
  { range: "6 wks", count: 1 },
  { range: "7 wks", count: 1 },
  { range: "8 wks", count: 1 },
  { range: "9 wks", count: 1 },
  { range: "10 wks", count: 1 },
  { range: "12 wks", count: 1 },
];

const inStockCount = mockOffers.filter((o) => o.stock > 0).length;
const outOfStockCount = mockOffers.length - inStockCount;

const stockPieData = [
  { name: "In Stock", value: inStockCount },
  { name: "Out of Stock", value: outOfStockCount },
];

const PIE_COLORS = ["#10b981", "#ef4444"];

// ---------------------------------------------------------------------------
// Smart recommendations
// ---------------------------------------------------------------------------

const bestValue = [...mockOffers]
  .filter((o) => o.stock > 0)
  .sort((a, b) => a.unit_price - b.unit_price)[0];

const fastestDelivery = [...mockOffers]
  .filter((o) => o.stock > 0)
  .sort((a, b) => a.lead_time_weeks - b.lead_time_weeks)[0];

const highestStock = [...mockOffers].sort((a, b) => b.stock - a.stock)[0];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SourcingPage() {
  const [inStockOnly, setInStockOnly] = useState(false);
  const [authorizedOnly, setAuthorizedOnly] = useState(false);
  const [bestPriceOnly, setBestPriceOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("price");

  // Filter offers
  let filteredOffers = [...mockOffers];

  if (inStockOnly) {
    filteredOffers = filteredOffers.filter((o) => o.stock > 0);
  }
  if (authorizedOnly) {
    filteredOffers = filteredOffers.filter((o) => o.authorized);
  }
  if (bestPriceOnly) {
    const minPrice = Math.min(...filteredOffers.map((o) => o.unit_price));
    filteredOffers = filteredOffers.filter(
      (o) => o.unit_price <= minPrice * 1.1
    );
  }

  // Sort offers
  filteredOffers.sort((a, b) => {
    switch (sortBy) {
      case "price":
        return a.unit_price - b.unit_price;
      case "leadtime":
        return a.lead_time_weeks - b.lead_time_weeks;
      case "stock":
        return b.stock - a.stock;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Header                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Part Sourcing</h1>
        <p className="text-muted-foreground">
          Compare supplier offers and find the best pricing
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. KPI cards                                                      */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Active Distributors"
          value={8}
          icon={Building2}
        />
        <KpiCard
          title="Total Offers"
          value={37}
          icon={FileText}
          trend={{ value: 8, positive: true }}
        />
        <KpiCard
          title="Avg Lead Time"
          value="6.2 wks"
          icon={Clock}
        />
        <KpiCard
          title="Best Price"
          value="$2.45"
          icon={DollarSign}
          trend={{ value: 3, positive: true }}
        />
        <KpiCard
          title="In Stock %"
          value="78%"
          icon={Package}
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Part selector card                                             */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Selected Part</CardTitle>
          <CardDescription>
            Currently comparing offers for this part
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Part</p>
              <p className="font-semibold">STM32F407VGT6</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm">ARM Cortex-M4 MCU 168MHz 1MB Flash</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Manufacturer</p>
              <p className="text-sm">STMicroelectronics</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Package</p>
              <p className="text-sm">LQFP-100</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lifecycle</p>
              <Badge className="mt-0.5 bg-emerald-100 text-emerald-700 border-emerald-200">
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Filter toggles                                                 */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={inStockOnly}
            onCheckedChange={(v) => setInStockOnly(v === true)}
          />
          In Stock Only
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={authorizedOnly}
            onCheckedChange={(v) => setAuthorizedOnly(v === true)}
          />
          Authorized Only
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={bestPriceOnly}
            onCheckedChange={(v) => setBestPriceOnly(v === true)}
          />
          Best Price Only
        </label>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price">Sort by: Best Price</SelectItem>
            <SelectItem value="leadtime">Sort by: Lead Time</SelectItem>
            <SelectItem value="stock">Sort by: Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 5. Offers data table                                              */}
      {/* ----------------------------------------------------------------- */}
      <DataTable
        columns={columns}
        data={filteredOffers}
        searchKey="supplier"
        searchPlaceholder="Search suppliers..."
      />

      {/* ----------------------------------------------------------------- */}
      {/* 6. Price comparison chart                                         */}
      {/* ----------------------------------------------------------------- */}
      <ChartContainer
        title="Price Comparison"
        subtitle="Unit price by supplier"
        height={320}
      >
        <BarChart data={priceChartData}>
          <XAxis
            dataKey="supplier"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${v.toFixed(2)}`}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value ?? 0)), "Unit Price"]}
          />
          <Legend />
          <Bar
            dataKey="price"
            name="Unit Price"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>

      {/* ----------------------------------------------------------------- */}
      {/* 7. Bottom row charts                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartContainer
          title="Lead Time Distribution"
          subtitle="Number of suppliers by lead time"
          height={280}
        >
          <BarChart data={leadTimeData}>
            <XAxis
              dataKey="range"
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
              dataKey="count"
              name="Suppliers"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>

        <ChartContainer
          title="Stock Availability"
          subtitle="Suppliers with stock vs out of stock"
          height={280}
        >
          <PieChart>
            <Pie
              data={stockPieData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              nameKey="name"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {stockPieData.map((entry, index) => (
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

      {/* ----------------------------------------------------------------- */}
      {/* 8. Smart Recommendations                                          */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Smart Recommendations
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Best Value */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Star className="size-4" />
                </div>
                <CardTitle className="text-base">Best Value</CardTitle>
              </div>
              <CardDescription>
                Best price among in-stock suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{bestValue.supplier}</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(bestValue.unit_price)} per unit &middot;{" "}
                {formatNumber(bestValue.stock)} in stock
              </p>
              <Button size="sm" className="mt-3 w-full">
                Select
              </Button>
            </CardContent>
          </Card>

          {/* Fastest Delivery */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Zap className="size-4" />
                </div>
                <CardTitle className="text-base">Fastest Delivery</CardTitle>
              </div>
              <CardDescription>
                Shortest lead time with available stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{fastestDelivery.supplier}</p>
              <p className="text-sm text-muted-foreground">
                {fastestDelivery.lead_time_weeks} weeks lead time &middot;{" "}
                {formatCurrency(fastestDelivery.unit_price)} per unit
              </p>
              <Button size="sm" className="mt-3 w-full">
                Select
              </Button>
            </CardContent>
          </Card>

          {/* Highest Stock */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <BarChart3 className="size-4" />
                </div>
                <CardTitle className="text-base">Highest Stock</CardTitle>
              </div>
              <CardDescription>
                Supplier with the most available units
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{highestStock.supplier}</p>
              <p className="text-sm text-muted-foreground">
                {formatNumber(highestStock.stock)} units &middot;{" "}
                {formatCurrency(highestStock.unit_price)} per unit
              </p>
              <Button size="sm" className="mt-3 w-full">
                Select
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
