"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Cpu,
  Shield,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

import type {
  Part,
  Manufacturer,
  Category,
  Assembly,
  AssemblyPart,
  SupplierOffer,
  Supplier,
  Alternative,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockManufacturer: Manufacturer = {
  id: "mfr-1",
  name: "STMicroelectronics",
  code: "STM",
  country: "Switzerland",
  website: "https://www.st.com",
};

const mockCategory: Category = {
  id: "cat-1",
  name: "Microcontrollers",
  part_count: 342,
};

const mockPart: Part = {
  id: "part-1",
  mpn: "STM32F407VGT6",
  manufacturer_id: "mfr-1",
  description:
    "ARM Cortex-M4 MCU with FPU, 168 MHz, 1 MB Flash, 192 KB SRAM, USB OTG, Ethernet, 12-bit ADC/DAC, LQFP-100",
  category_id: "cat-1",
  package_info: "LQFP-100 (14x14mm)",
  specs: {
    Core: "ARM Cortex-M4F",
    Frequency: "168 MHz",
    Flash: "1 MB",
    RAM: "192 KB",
    "Voltage Range": "1.8V – 3.6V",
    Package: "LQFP-100",
    "Operating Temp": "-40°C to +85°C",
    "I/O Count": "82",
    ADC: "3x 12-bit, 2.4 MSPS",
    DAC: "2x 12-bit",
    Timers: "14",
    Communication: "SPI, I2C, USART, USB OTG, CAN, Ethernet",
    DMA: "2x DMA controllers, 16 streams",
    "Supply Current (Run)": "138 mA (typical, all peripherals on)",
  },
  lifecycle_status: "Active",
  rohs: true,
  reach: true,
  aec_q: false,
  risk_score: 22,
  risk_level: "Low",
  inventory_stock: 2500,
  created_at: "2024-03-15T10:00:00Z",
  manufacturer: mockManufacturer,
  category: mockCategory,
};

const mockSuppliers: Supplier[] = [
  {
    id: "sup-1",
    name: "Digi-Key",
    authorized: true,
    country: "USA",
    website: "https://www.digikey.com",
  },
  {
    id: "sup-2",
    name: "Mouser",
    authorized: true,
    country: "USA",
    website: "https://www.mouser.com",
  },
  {
    id: "sup-3",
    name: "Arrow",
    authorized: true,
    country: "USA",
    website: "https://www.arrow.com",
  },
  {
    id: "sup-4",
    name: "Farnell",
    authorized: true,
    country: "UK",
    website: "https://www.farnell.com",
  },
  {
    id: "sup-5",
    name: "LCSC",
    authorized: false,
    country: "China",
    website: "https://www.lcsc.com",
  },
];

const mockOffers: (SupplierOffer & { supplier: Supplier })[] = [
  {
    id: "offer-1",
    part_id: "part-1",
    supplier_id: "sup-1",
    packaging: "Tray",
    moq: 1,
    lead_time_weeks: 2,
    stock: 4_820,
    unit_price: 12.45,
    currency: "USD",
    origin_country: "China",
    last_updated: "2026-02-10T08:00:00Z",
    supplier: mockSuppliers[0],
  },
  {
    id: "offer-2",
    part_id: "part-1",
    supplier_id: "sup-2",
    packaging: "Tray",
    moq: 1,
    lead_time_weeks: 3,
    stock: 3_150,
    unit_price: 12.62,
    currency: "USD",
    origin_country: "China",
    last_updated: "2026-02-10T09:30:00Z",
    supplier: mockSuppliers[1],
  },
  {
    id: "offer-3",
    part_id: "part-1",
    supplier_id: "sup-3",
    packaging: "Tray",
    moq: 10,
    lead_time_weeks: 4,
    stock: 8_000,
    unit_price: 11.8,
    currency: "USD",
    origin_country: "China",
    last_updated: "2026-02-09T14:00:00Z",
    supplier: mockSuppliers[2],
  },
  {
    id: "offer-4",
    part_id: "part-1",
    supplier_id: "sup-4",
    packaging: "Tray",
    moq: 1,
    lead_time_weeks: 5,
    stock: 1_200,
    unit_price: 13.1,
    currency: "USD",
    origin_country: "China",
    last_updated: "2026-02-08T11:00:00Z",
    supplier: mockSuppliers[3],
  },
  {
    id: "offer-5",
    part_id: "part-1",
    supplier_id: "sup-5",
    packaging: "Tape & Reel",
    moq: 5,
    lead_time_weeks: 6,
    stock: 12_400,
    unit_price: 9.75,
    currency: "USD",
    origin_country: "China",
    last_updated: "2026-02-10T06:00:00Z",
    supplier: mockSuppliers[4],
  },
];

const bestPriceOfferId = mockOffers.reduce((best, o) =>
  o.unit_price < best.unit_price ? o : best
).id;

const mockAssemblyParts: (AssemblyPart & { assembly: Assembly })[] = [
  {
    id: "ap-1",
    assembly_id: "asm-1",
    part_id: "part-1",
    quantity: 1,
    ref_designator: "U1",
    assembly: {
      id: "asm-1",
      name: "ECU Main Board v3.2",
      customer: "Volkswagen AG",
      status: "Production",
      line_item_count: 87,
      total_quantity: 342,
      created_at: "2024-01-10T00:00:00Z",
      z2data_enrichment_status: "none",
      z2data_enriched_count: 0,
      z2data_total_enrichable: 0,
    },
  },
  {
    id: "ap-2",
    assembly_id: "asm-2",
    part_id: "part-1",
    quantity: 2,
    ref_designator: "U3, U7",
    assembly: {
      id: "asm-2",
      name: "Motor Controller Rev C",
      customer: "Bosch",
      status: "Prototype",
      line_item_count: 124,
      total_quantity: 589,
      created_at: "2025-06-01T00:00:00Z",
      z2data_enrichment_status: "none",
      z2data_enriched_count: 0,
      z2data_total_enrichable: 0,
    },
  },
  {
    id: "ap-3",
    assembly_id: "asm-3",
    part_id: "part-1",
    quantity: 1,
    ref_designator: "U1",
    assembly: {
      id: "asm-3",
      name: "Sensor Hub Module",
      customer: "Continental",
      status: "Production",
      line_item_count: 43,
      total_quantity: 156,
      created_at: "2024-09-20T00:00:00Z",
      z2data_enrichment_status: "none",
      z2data_enriched_count: 0,
      z2data_total_enrichable: 0,
    },
  },
  {
    id: "ap-4",
    assembly_id: "asm-4",
    part_id: "part-1",
    quantity: 1,
    ref_designator: "U2",
    assembly: {
      id: "asm-4",
      name: "Telemetry Gateway v1.0",
      customer: "ZF Friedrichshafen",
      status: "NPI",
      line_item_count: 56,
      total_quantity: 210,
      created_at: "2025-11-05T00:00:00Z",
      z2data_enrichment_status: "none",
      z2data_enriched_count: 0,
      z2data_total_enrichable: 0,
    },
  },
];

const mockAlternativeParts: Part[] = [
  {
    id: "part-alt-1",
    mpn: "STM32F405RGT6",
    manufacturer_id: "mfr-1",
    description:
      "ARM Cortex-M4 MCU 168 MHz, 1 MB Flash, 192 KB SRAM, LQFP-64",
    category_id: "cat-1",
    package_info: "LQFP-64",
    specs: {},
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    risk_score: 18,
    risk_level: "Low",
    inventory_stock: 5_200,
    created_at: "2024-02-01T00:00:00Z",
    manufacturer: mockManufacturer,
    category: mockCategory,
  },
  {
    id: "part-alt-2",
    mpn: "GD32F407VGT6",
    manufacturer_id: "mfr-2",
    description:
      "ARM Cortex-M4 MCU 168 MHz, 1 MB Flash, 192 KB SRAM, LQFP-100",
    category_id: "cat-1",
    package_info: "LQFP-100",
    specs: {},
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    risk_score: 45,
    risk_level: "Medium",
    inventory_stock: 800,
    created_at: "2024-05-10T00:00:00Z",
    manufacturer: {
      id: "mfr-2",
      name: "GigaDevice",
      code: "GD",
      country: "China",
      website: "https://www.gigadevice.com",
    },
    category: mockCategory,
  },
  {
    id: "part-alt-3",
    mpn: "ATSAME70Q21B",
    manufacturer_id: "mfr-3",
    description:
      "ARM Cortex-M7 MCU 300 MHz, 2 MB Flash, 384 KB SRAM, LQFP-144",
    category_id: "cat-1",
    package_info: "LQFP-144",
    specs: {},
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: true,
    risk_score: 15,
    risk_level: "Low",
    inventory_stock: 3_100,
    created_at: "2024-04-22T00:00:00Z",
    manufacturer: {
      id: "mfr-3",
      name: "Microchip Technology",
      code: "MCHP",
      country: "USA",
      website: "https://www.microchip.com",
    },
    category: mockCategory,
  },
];

const mockAlternatives: Alternative[] = [
  {
    id: "alt-1",
    original_part_id: "part-1",
    alternative_part_id: "part-alt-1",
    similarity_score: 92,
    notes:
      "Same silicon die, smaller package (64-pin vs 100-pin). Fewer GPIOs and no Ethernet MAC. Drop-in for designs not using the extra peripherals.",
    alternative_part: mockAlternativeParts[0],
  },
  {
    id: "alt-2",
    original_part_id: "part-1",
    alternative_part_id: "part-alt-2",
    similarity_score: 85,
    notes:
      "Pin-compatible clone from GigaDevice. Identical footprint and peripheral set. May require minor firmware adjustments for register-level differences.",
    alternative_part: mockAlternativeParts[1],
  },
  {
    id: "alt-3",
    original_part_id: "part-1",
    alternative_part_id: "part-alt-3",
    similarity_score: 68,
    notes:
      "Higher-performance Cortex-M7 alternative. Different pinout (144 vs 100 pins) -- requires board redesign. AEC-Q100 qualified.",
    alternative_part: mockAlternativeParts[2],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lifecycleColor(status: string) {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "NRND":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    case "EOL":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
    case "Obsolete":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    default:
      return "";
  }
}

function riskColor(score: number) {
  if (score <= 25) return "text-emerald-600 dark:text-emerald-400";
  if (score <= 50) return "text-amber-600 dark:text-amber-400";
  if (score <= 75) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function riskProgressClass(score: number) {
  if (score <= 25) return "[&_[data-slot=progress-indicator]]:bg-emerald-500";
  if (score <= 50) return "[&_[data-slot=progress-indicator]]:bg-amber-500";
  if (score <= 75) return "[&_[data-slot=progress-indicator]]:bg-orange-500";
  return "[&_[data-slot=progress-indicator]]:bg-red-500";
}

function assemblyStatusColor(status: string) {
  switch (status) {
    case "Production":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "Prototype":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    case "NPI":
      return "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300";
    default:
      return "";
  }
}

function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

function formatCurrency(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function PartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  // In a real app we would fetch by `id`. For now, always show mock data.
  const part = mockPart;
  const specs = part.specs as Record<string, string>;

  const keySpecs = [
    { label: "Core", value: specs["Core"] },
    { label: "Frequency", value: specs["Frequency"] },
    { label: "Flash", value: specs["Flash"] },
    { label: "RAM", value: specs["RAM"] },
    { label: "Voltage Range", value: specs["Voltage Range"] },
    { label: "Package", value: specs["Package"] },
  ];

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Breadcrumb / back link                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Parts Database
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-foreground font-medium">{part.mpn}</span>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Part header card                                                  */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Left: identity */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Cpu className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {part.mpn}
                </h1>
                <Badge
                  className={lifecycleColor(part.lifecycle_status)}
                  variant="outline"
                >
                  {part.lifecycle_status}
                </Badge>
              </div>

              <p className="max-w-2xl text-muted-foreground">
                {part.description}
              </p>

              {/* Meta badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {part.manufacturer?.name ?? "Unknown"}
                </Badge>
                <Badge variant="secondary">
                  {part.category?.name ?? "Uncategorised"}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Package className="h-3 w-3" />
                  {part.package_info}
                </Badge>
              </div>

              {/* Compliance badges */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-medium text-muted-foreground">
                  Compliance:
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  {part.rohs ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  RoHS
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  {part.reach ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  REACH
                </span>
                <span
                  className={`inline-flex items-center gap-1 ${
                    part.aec_q
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500"
                  }`}
                >
                  {part.aec_q ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  AEC-Q
                </span>
              </div>
            </div>

            {/* Right: stats */}
            <div className="grid w-full max-w-xs shrink-0 grid-cols-1 gap-4">
              {/* Risk */}
              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Risk Score
                  </span>
                  <span className={`text-lg font-bold ${riskColor(part.risk_score)}`}>
                    {part.risk_score}/100
                  </span>
                </div>
                <Progress
                  value={part.risk_score}
                  className={`h-2 ${riskProgressClass(part.risk_score)}`}
                />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  Risk Level: <span className="font-medium text-foreground">{part.risk_level}</span>
                </div>
              </div>

              {/* Inventory */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Inventory
                </span>
                <span className="text-lg font-bold">
                  {formatNumber(part.inventory_stock)} units
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Tabs                                                              */}
      {/* ----------------------------------------------------------------- */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="used-in">Used In</TabsTrigger>
          <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
        </TabsList>

        {/* =============================================================== */}
        {/* Overview                                                        */}
        {/* =============================================================== */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          {/* Description card */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-muted-foreground">
                The <strong className="text-foreground">{part.mpn}</strong> is a
                high-performance ARM Cortex-M4 microcontroller from{" "}
                {part.manufacturer?.name}. It features a 168 MHz clock, 1 MB of
                on-chip Flash memory, and 192 KB of SRAM. The device integrates
                a rich set of peripherals including USB OTG FS/HS, Ethernet MAC,
                three 12-bit ADCs, two DACs, and a variety of communication
                interfaces (SPI, I2C, USART, CAN). It is widely used in
                industrial control, motor drives, medical equipment, and
                automotive gateway applications.
              </p>
            </CardContent>
          </Card>

          {/* Key specs grid */}
          <Card>
            <CardHeader>
              <CardTitle>Key Specifications</CardTitle>
              <CardDescription>
                Core electrical and mechanical characteristics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {keySpecs.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg border bg-muted/40 p-3"
                  >
                    <p className="text-xs font-medium text-muted-foreground">
                      {s.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold">{s.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Package info */}
          <Card>
            <CardHeader>
              <CardTitle>Package Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Package Type</p>
                  <p className="font-medium">LQFP-100</p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div>
                  <p className="text-muted-foreground">Dimensions</p>
                  <p className="font-medium">14 x 14 mm</p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div>
                  <p className="text-muted-foreground">Pin Pitch</p>
                  <p className="font-medium">0.5 mm</p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div>
                  <p className="text-muted-foreground">Mounting</p>
                  <p className="font-medium">Surface Mount</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============================================================== */}
        {/* Specifications                                                  */}
        {/* =============================================================== */}
        <TabsContent value="specifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Full Specifications</CardTitle>
              <CardDescription>
                All parameters from the component data sheet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[240px]">Parameter</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(specs).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium text-muted-foreground">
                        {key}
                      </TableCell>
                      <TableCell>{String(value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============================================================== */}
        {/* Pricing                                                         */}
        {/* =============================================================== */}
        <TabsContent value="pricing" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Offers</CardTitle>
              <CardDescription>
                Pricing and availability across authorized and open-market
                distributors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Packaging</TableHead>
                    <TableHead className="text-right">MOQ</TableHead>
                    <TableHead className="text-right">Lead Time</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">
                      Total (MOQ x Price)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockOffers.map((offer) => {
                    const isBest = offer.id === bestPriceOfferId;
                    return (
                      <TableRow
                        key={offer.id}
                        className={
                          isBest
                            ? "bg-emerald-50/60 dark:bg-emerald-950/20"
                            : ""
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {offer.supplier.name}
                            </span>
                            {offer.supplier.authorized && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700"
                              >
                                Authorized
                              </Badge>
                            )}
                            {isBest && (
                              <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                                Best Price
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{offer.packaging}</TableCell>
                        <TableCell className="text-right">
                          {formatNumber(offer.moq)}
                        </TableCell>
                        <TableCell className="text-right">
                          {offer.lead_time_weeks} wks
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(offer.stock)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(offer.unit_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(offer.moq * offer.unit_price)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============================================================== */}
        {/* Used In                                                         */}
        {/* =============================================================== */}
        <TabsContent value="used-in" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Used In Assemblies</CardTitle>
              <CardDescription>
                BOMs and assemblies that reference this part
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assembly Name</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Ref Designator</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAssemblyParts.map((ap) => (
                    <TableRow key={ap.id}>
                      <TableCell className="font-medium">
                        {ap.assembly.name}
                      </TableCell>
                      <TableCell>{ap.assembly.customer}</TableCell>
                      <TableCell className="text-right">
                        {ap.quantity}
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {ap.ref_designator}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={assemblyStatusColor(ap.assembly.status)}
                        >
                          {ap.assembly.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============================================================== */}
        {/* Alternatives                                                    */}
        {/* =============================================================== */}
        <TabsContent value="alternatives" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Alternative Parts</h3>
              <p className="text-sm text-muted-foreground">
                Potential replacements ranked by similarity to {part.mpn}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mockAlternatives.map((alt) => {
              const altPart = alt.alternative_part!;
              const score = alt.similarity_score;

              return (
                <Card key={alt.id} className="flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          {altPart.mpn}
                        </CardTitle>
                        <CardDescription>
                          {altPart.manufacturer?.name}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className={lifecycleColor(altPart.lifecycle_status)}
                      >
                        {altPart.lifecycle_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {altPart.description}
                    </p>

                    {/* Similarity */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Similarity
                        </span>
                        <span className="font-semibold">{score}%</span>
                      </div>
                      <Progress
                        value={score}
                        className={`h-2 ${
                          score >= 80
                            ? "[&_[data-slot=progress-indicator]]:bg-emerald-500"
                            : score >= 60
                              ? "[&_[data-slot=progress-indicator]]:bg-amber-500"
                              : "[&_[data-slot=progress-indicator]]:bg-orange-500"
                        }`}
                      />
                    </div>

                    {/* Notes */}
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {alt.notes}
                    </p>

                    <Separator />

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        Select Alternative
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Compare
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
