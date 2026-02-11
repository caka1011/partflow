"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  Cpu,
  GitBranch,
  Target,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  Shuffle,
} from "lucide-react";

import { KpiCard } from "@/components/layout/kpi-card";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlternativeRow {
  id: string;
  mpn: string;
  description: string;
  manufacturer: string;
  package_info: string;
  stock: number;
  lifecycle: "Active" | "NRND" | "EOL" | "Obsolete";
  rohs: boolean;
  reach: boolean;
  aec_q: boolean;
  similarity: number;
  price: number;
}

interface ComparisonSpec {
  label: string;
  original: string;
  alt1: string;
  alt2: string;
  alt1Status: "good" | "warning" | "bad";
  alt2Status: "good" | "warning" | "bad";
}

interface ManufacturerCrossRef {
  manufacturer: string;
  partCount: number;
  topPart: string;
  similarity: number;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockAlternatives: AlternativeRow[] = [
  {
    id: "alt-1",
    mpn: "ATSAMD21G18A-AUT",
    description: "ARM Cortex-M0+ MCU, 48MHz, 256KB Flash, 32KB RAM",
    manufacturer: "Microchip Technology",
    package_info: "TQFP-48",
    stock: 2000,
    lifecycle: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    similarity: 82,
    price: 2.4,
  },
  {
    id: "alt-2",
    mpn: "STM32F103C8T6",
    description: "ARM Cortex-M3 MCU, 72MHz, 64KB Flash, 20KB RAM",
    manufacturer: "STMicroelectronics",
    package_info: "LQFP-48",
    stock: 8000,
    lifecycle: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    similarity: 76,
    price: 1.2,
  },
  {
    id: "alt-3",
    mpn: "ESP32-WROOM-32D",
    description: "Wi-Fi & BT/BLE MCU Module, 240MHz, 4MB Flash, 520KB SRAM",
    manufacturer: "Espressif Systems",
    package_info: "Module",
    stock: 5000,
    lifecycle: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    similarity: 58,
    price: 3.1,
  },
  {
    id: "alt-4",
    mpn: "PIC16F877A-I/P",
    description: "8-bit PIC MCU, 20MHz, 14KB Flash, 368B RAM",
    manufacturer: "Microchip Technology",
    package_info: "PDIP-40",
    stock: 12000,
    lifecycle: "Active",
    rohs: true,
    reach: false,
    aec_q: false,
    similarity: 45,
    price: 4.85,
  },
];

const comparisonSpecs: ComparisonSpec[] = [
  {
    label: "Architecture",
    original: "AVR 8-bit",
    alt1: "ARM Cortex-M0+",
    alt2: "ARM Cortex-M3",
    alt1Status: "warning",
    alt2Status: "warning",
  },
  {
    label: "Clock Speed",
    original: "20MHz",
    alt1: "48MHz",
    alt2: "72MHz",
    alt1Status: "good",
    alt2Status: "good",
  },
  {
    label: "Flash",
    original: "32KB",
    alt1: "256KB",
    alt2: "64KB",
    alt1Status: "good",
    alt2Status: "good",
  },
  {
    label: "RAM",
    original: "2KB",
    alt1: "32KB",
    alt2: "20KB",
    alt1Status: "good",
    alt2Status: "good",
  },
  {
    label: "GPIO Pins",
    original: "23",
    alt1: "38",
    alt2: "37",
    alt1Status: "good",
    alt2Status: "good",
  },
  {
    label: "ADC Channels",
    original: "8",
    alt1: "14",
    alt2: "10",
    alt1Status: "good",
    alt2Status: "good",
  },
  {
    label: "Communication",
    original: "SPI/I2C/UART",
    alt1: "SPI/I2C/UART/USB",
    alt2: "SPI/I2C/UART/USB/CAN",
    alt1Status: "good",
    alt2Status: "good",
  },
  {
    label: "Package",
    original: "TQFP-32",
    alt1: "TQFP-48",
    alt2: "LQFP-48",
    alt1Status: "warning",
    alt2Status: "warning",
  },
  {
    label: "Price",
    original: "$1.85",
    alt1: "$2.40",
    alt2: "$1.20",
    alt1Status: "warning",
    alt2Status: "good",
  },
  {
    label: "Lifecycle",
    original: "NRND",
    alt1: "Active",
    alt2: "Active",
    alt1Status: "good",
    alt2Status: "good",
  },
];

const manufacturerCrossRefs: ManufacturerCrossRef[] = [
  {
    manufacturer: "Microchip Technology",
    partCount: 3,
    topPart: "ATSAMD21G18A-AUT",
    similarity: 82,
  },
  {
    manufacturer: "STMicroelectronics",
    partCount: 2,
    topPart: "STM32F103C8T6",
    similarity: 76,
  },
  {
    manufacturer: "Espressif Systems",
    partCount: 1,
    topPart: "ESP32-WROOM-32D",
    similarity: 58,
  },
  {
    manufacturer: "NXP Semiconductors",
    partCount: 1,
    topPart: "LPC1768FBD100",
    similarity: 70,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function getLifecycleBadgeClasses(status: string): string {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "NRND":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "EOL":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "Obsolete":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getSimilarityColor(similarity: number): string {
  if (similarity >= 80) return "bg-emerald-500";
  if (similarity >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function getStatusIcon(status: "good" | "warning" | "bad") {
  switch (status) {
    case "good":
      return <CheckCircle2 className="size-4 text-emerald-600" />;
    case "warning":
      return <AlertCircle className="size-4 text-amber-600" />;
    case "bad":
      return <XCircle className="size-4 text-red-600" />;
  }
}

// ---------------------------------------------------------------------------
// Table columns
// ---------------------------------------------------------------------------

const columns: ColumnDef<AlternativeRow>[] = [
  {
    accessorKey: "mpn",
    header: "Part Number",
    cell: ({ row }) => (
      <div className="min-w-[200px]">
        <p className="font-semibold">{row.original.mpn}</p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
          {row.original.description}
        </p>
      </div>
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
    accessorKey: "package_info",
    header: "Package",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.package_info}</span>
    ),
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
          <span className="tabular-nums text-sm">{formatNumber(stock)}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "lifecycle",
    header: "Lifecycle",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={getLifecycleBadgeClasses(row.original.lifecycle)}
      >
        {row.original.lifecycle}
      </Badge>
    ),
  },
  {
    id: "compliance",
    header: "Compliance",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.rohs && (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0">
            RoHS
          </Badge>
        )}
        {row.original.reach && (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
            REACH
          </Badge>
        )}
        {row.original.aec_q && (
          <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px] px-1.5 py-0">
            AEC-Q
          </Badge>
        )}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "similarity",
    header: "Similarity %",
    cell: ({ row }) => {
      const similarity = row.original.similarity;
      return (
        <div className="flex items-center gap-2 min-w-[120px]">
          <div className="relative h-2 w-16 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`absolute inset-y-0 left-0 rounded-full ${getSimilarityColor(similarity)}`}
              style={{ width: `${similarity}%` }}
            />
          </div>
          <span className="text-xs font-medium tabular-nums">{similarity}%</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="default" className="gap-1">
          Select
        </Button>
        <Button size="sm" variant="outline" className="gap-1">
          Compare
        </Button>
      </div>
    ),
    enableSorting: false,
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AlternativesPage() {
  return (
    <div className="space-y-8">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Header + KPI cards                                             */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Part Alternatives
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cross-reference and compare alternative components for ATMega328P-AU
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Original Part"
          value="ATMega328P-AU"
          icon={Cpu}
        />
        <KpiCard
          title="Alternatives Found"
          value={4}
          icon={GitBranch}
        />
        <KpiCard
          title="Best Similarity"
          value="92%"
          icon={Target}
        />
        <KpiCard
          title="Price Range"
          value="$1.20 - $4.85"
          icon={DollarSign}
        />
        <KpiCard
          title="Avg Lead Time"
          value="6.5 wks"
          icon={Clock}
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Original part info card                                        */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Original Part Details</CardTitle>
          <CardDescription>
            Part being replaced or cross-referenced
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Part Number</p>
              <p className="font-semibold">ATMega328P-AU</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Manufacturer</p>
              <p className="text-sm">Microchip Technology</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm">8-bit AVR MCU 20MHz</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Package</p>
              <p className="text-sm">TQFP-32</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lifecycle</p>
              <Badge
                variant="outline"
                className="mt-0.5 bg-amber-100 text-amber-700 border-amber-200"
              >
                NRND
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Risk Score</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="relative h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-amber-500"
                    style={{ width: "65%" }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums">
                  65/100
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Alternatives comparison table                                  */}
      {/* ----------------------------------------------------------------- */}
      <Card className="gap-0 py-0">
        <CardHeader className="pb-4 pt-5">
          <CardTitle className="text-base">Alternative Components</CardTitle>
          <CardDescription>
            Ranked by similarity score to ATMega328P-AU
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-5">
          <DataTable
            columns={columns}
            data={mockAlternatives}
            searchKey="mpn"
            searchPlaceholder="Search alternatives..."
          />
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Side-by-side comparison                                        */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Detailed Comparison</CardTitle>
              <CardDescription>
                Side-by-side specification comparison of original and top
                alternatives
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Shuffle className="size-3.5" />
              Change Parts
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Comparison header */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-sm font-medium text-muted-foreground">
              Specification
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">ATMega328P-AU</p>
              <Badge
                variant="outline"
                className="mt-1 bg-amber-100 text-amber-700 border-amber-200"
              >
                Original
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">ATSAMD21G18A-AUT</p>
              <Badge
                variant="outline"
                className="mt-1 bg-blue-100 text-blue-700 border-blue-200"
              >
                82% Match
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">STM32F103C8T6</p>
              <Badge
                variant="outline"
                className="mt-1 bg-blue-100 text-blue-700 border-blue-200"
              >
                76% Match
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Comparison rows */}
          <div className="divide-y">
            {comparisonSpecs.map((spec) => (
              <div
                key={spec.label}
                className="grid grid-cols-4 gap-4 py-3 items-center"
              >
                <div className="text-sm font-medium text-muted-foreground">
                  {spec.label}
                </div>
                <div className="text-center text-sm">{spec.original}</div>
                <div className="flex items-center justify-center gap-1.5 text-sm">
                  {getStatusIcon(spec.alt1Status)}
                  <span>{spec.alt1}</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-sm">
                  {getStatusIcon(spec.alt2Status)}
                  <span>{spec.alt2}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 5. Recommendation card                                            */}
      {/* ----------------------------------------------------------------- */}
      <Card className="border-emerald-200 bg-emerald-50/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Target className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">
                Recommended Alternative: ATSAMD21G18A-AUT
              </CardTitle>
              <CardDescription>
                Best overall match based on similarity, availability, and
                lifecycle status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Similarity score */}
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Similarity Score</span>
                  <span className="text-sm font-bold text-emerald-700">
                    82%
                  </span>
                </div>
                <Progress value={82} className="h-2.5" />
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    Key Advantages
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                      Same manufacturer (Microchip Technology)
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                      Higher performance (48MHz vs 20MHz, 256KB vs 32KB Flash)
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                      Active lifecycle status
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4">
                <p className="text-sm font-medium text-amber-800">
                  Key Concerns
                </p>
                <ul className="mt-1.5 space-y-1">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                    Different architecture (ARM vs AVR) requires firmware
                    rewrite
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                    Larger package (TQFP-48 vs TQFP-32) may require PCB
                    redesign
                  </li>
                </ul>
              </div>

              <Separator className="my-4" />

              <div className="flex flex-wrap gap-3">
                <Button className="gap-1.5">
                  <ArrowRight className="size-3.5" />
                  Select This Alternative
                </Button>
                <Button variant="outline" className="gap-1.5">
                  Request Engineering Review
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 6. Manufacturer cross-reference                                   */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Manufacturer Cross-Reference
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {manufacturerCrossRefs.map((mfr) => (
            <Card key={mfr.manufacturer}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Cpu className="size-4" />
                  </div>
                  <CardTitle className="text-sm">{mfr.manufacturer}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Similar Parts
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {mfr.partCount}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Top Match</p>
                    <p className="text-sm font-medium">{mfr.topPart}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full ${getSimilarityColor(mfr.similarity)}`}
                        style={{ width: `${mfr.similarity}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums">
                      {mfr.similarity}%
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
