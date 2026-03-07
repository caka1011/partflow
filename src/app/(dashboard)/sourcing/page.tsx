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
} from "recharts";
import {
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
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
  part: string;
  lead_time_weeks: number;
  stock: number;
  unit_price: number;
  origin_country: string;
  manufacturer: string;
}

const mockOffers: OfferRow[] = [
  {
    id: "off-1",
    supplier: "Digi-Key",
    authorized: true,
    part: "STM32F407VGT6",
    lead_time_weeks: 6,
    stock: 14523,
    unit_price: 3.8742,
    origin_country: "US",
    manufacturer: "STMicroelectronics",
  },
  {
    id: "off-2",
    supplier: "Mouser",
    authorized: true,
    part: "ESP32-WROOM-32E",
    lead_time_weeks: 5,
    stock: 8740,
    unit_price: 3.9215,
    origin_country: "US",
    manufacturer: "Espressif",
  },
  {
    id: "off-3",
    supplier: "Arrow",
    authorized: true,
    part: "TPS63020DSJR",
    lead_time_weeks: 8,
    stock: 3200,
    unit_price: 3.51,
    origin_country: "US",
    manufacturer: "Texas Instruments",
  },
  {
    id: "off-4",
    supplier: "Farnell",
    authorized: true,
    part: "LIS3DHTR",
    lead_time_weeks: 7,
    stock: 5610,
    unit_price: 4.128,
    origin_country: "GB",
    manufacturer: "STMicroelectronics",
  },
  {
    id: "off-5",
    supplier: "RS Components",
    authorized: true,
    part: "MAX17048G+T10",
    lead_time_weeks: 9,
    stock: 2100,
    unit_price: 3.65,
    origin_country: "GB",
    manufacturer: "Analog Devices",
  },
  {
    id: "off-6",
    supplier: "LCSC",
    authorized: false,
    part: "GD32F303CCT6",
    lead_time_weeks: 12,
    stock: 0,
    unit_price: 2.45,
    origin_country: "CN",
    manufacturer: "GigaDevice",
  },
  {
    id: "off-7",
    supplier: "TME",
    authorized: true,
    part: "ATMEGA328P-AU",
    lead_time_weeks: 4,
    stock: 920,
    unit_price: 4.56,
    origin_country: "PL",
    manufacturer: "Microchip",
  },
  {
    id: "off-8",
    supplier: "Win Source",
    authorized: false,
    part: "NRF52840-QIAA",
    lead_time_weeks: 10,
    stock: 15000,
    unit_price: 5.18,
    origin_country: "HK",
    manufacturer: "Nordic Semiconductor",
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
    accessorKey: "part",
    header: "Part",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.part}</span>
    ),
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
    accessorKey: "origin_country",
    header: "Origin",
  },
  {
    accessorKey: "manufacturer",
    header: "Manufacturer",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.manufacturer}</span>
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

const leadTimeBySupplierData = mockOffers.map((o) => ({
  supplier: o.supplier,
  leadTime: o.lead_time_weeks,
}));

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SourcingPage() {
  const [inStockOnly, setInStockOnly] = useState(false);
  const [authorizedOnly, setAuthorizedOnly] = useState(false);
  const [bestPriceOnly, setBestPriceOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("price");
  const [selectedProject, setSelectedProject] = useState<string>("nightrunner-cortex");

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Parts"
          value={83}
          icon={Package}
        />
        <KpiCard
          title="Avg Lead Time"
          value="6 wks"
          icon={Clock}
        />
        <KpiCard
          title="Material Cost"
          value={"\u03A3 500 Riyal"}
          icon={DollarSign}
        />
        <KpiCard
          title="In Stock %"
          value="78%"
          icon={ShoppingCart}
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Project selector card                                          */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Selected Project: Nightrunner Cortex</CardTitle>
          <CardDescription>
            Choose a project to view its sourcing details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Project</p>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nightrunner-cortex">Nightrunner Cortex</SelectItem>
                  <SelectItem value="powergrid-alpha">PowerGrid Alpha</SelectItem>
                  <SelectItem value="sensor-hub-v2">Sensor Hub v2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Parts</p>
              <p className="text-sm font-semibold">83</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Suppliers</p>
              <p className="text-sm font-semibold">12</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
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
      {/* 6. Bottom row charts                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartContainer
          title="Price Comparison \u2014 STM32F407VGT6"
          subtitle="Unit price by supplier"
          height={280}
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

        <ChartContainer
          title="Lead Time by Supplier \u2014 STM32F407VGT6"
          subtitle="Lead time in weeks per supplier"
          height={280}
        >
          <BarChart data={leadTimeBySupplierData}>
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
              allowDecimals={false}
              tickFormatter={(v: number) => `${v} wks`}
            />
            <Tooltip
              formatter={(value) => [`${value} weeks`, "Lead Time"]}
            />
            <Legend />
            <Bar
              dataKey="leadTime"
              name="Lead Time (wks)"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
