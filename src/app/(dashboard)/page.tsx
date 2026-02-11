"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Package,
  FileStack,
  AlertTriangle,
  Clock,
  DollarSign,
  Eye,
  Search,
  Upload,
  ShieldAlert,
  TrendingUp,
  AlertCircle,
  Info,
} from "lucide-react";
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

import type {
  Part,
  LifecycleStatus,
  AlertSeverity,
  Alert,
} from "@/lib/types";
import { KpiCard } from "@/components/layout/kpi-card";
import { DataTable } from "@/components/data-table/data-table";
import { ChartContainer } from "@/components/charts/chart-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PartWithRelations extends Part {
  manufacturer_name: string;
  manufacturer_code: string;
  category_name: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockParts: PartWithRelations[] = [
  {
    id: "p-001",
    mpn: "STM32F407VGT6",
    manufacturer_id: "m-001",
    description: "ARM Cortex-M4 MCU, 168MHz, 1MB Flash, 192KB RAM, LQFP-100",
    category_id: "c-001",
    package_info: "LQFP-100",
    specs: { core: "Cortex-M4", flash: "1MB", ram: "192KB" },
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    risk_score: 22,
    risk_level: "Low",
    inventory_stock: 4500,
    created_at: "2024-11-01T00:00:00Z",
    manufacturer_name: "STMicroelectronics",
    manufacturer_code: "STM",
    category_name: "Microcontrollers",
  },
  {
    id: "p-002",
    mpn: "TPS54620RGYR",
    manufacturer_id: "m-002",
    description: "6A Step-Down Converter, 17V Input, 600kHz, QFN-14",
    category_id: "c-002",
    package_info: "QFN-14",
    specs: { current: "6A", input_voltage: "17V" },
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: true,
    risk_score: 15,
    risk_level: "Low",
    inventory_stock: 12000,
    created_at: "2024-10-15T00:00:00Z",
    manufacturer_name: "Texas Instruments",
    manufacturer_code: "TI",
    category_name: "Power Management",
  },
  {
    id: "p-003",
    mpn: "LM358DR",
    manufacturer_id: "m-002",
    description: "Dual Op-Amp, 1MHz, 3-32V Supply, SOIC-8",
    category_id: "c-003",
    package_info: "SOIC-8",
    specs: { channels: 2, bandwidth: "1MHz" },
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    risk_score: 10,
    risk_level: "Low",
    inventory_stock: 25000,
    created_at: "2024-09-20T00:00:00Z",
    manufacturer_name: "Texas Instruments",
    manufacturer_code: "TI",
    category_name: "Analog ICs",
  },
  {
    id: "p-004",
    mpn: "ATMega328P-AU",
    manufacturer_id: "m-003",
    description: "8-bit AVR MCU, 20MHz, 32KB Flash, 2KB RAM, TQFP-32",
    category_id: "c-001",
    package_info: "TQFP-32",
    specs: { core: "AVR", flash: "32KB", ram: "2KB" },
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    risk_score: 45,
    risk_level: "Medium",
    inventory_stock: 8200,
    created_at: "2024-08-10T00:00:00Z",
    manufacturer_name: "Microchip",
    manufacturer_code: "MCHP",
    category_name: "Microcontrollers",
  },
  {
    id: "p-005",
    mpn: "ESP32-WROOM-32D",
    manufacturer_id: "m-004",
    description: "Wi-Fi & BT/BLE MCU Module, 4MB Flash, 520KB SRAM",
    category_id: "c-001",
    package_info: "Module",
    specs: { wifi: "802.11 b/g/n", bluetooth: "4.2" },
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    risk_score: 28,
    risk_level: "Low",
    inventory_stock: 6700,
    created_at: "2024-10-01T00:00:00Z",
    manufacturer_name: "Espressif",
    manufacturer_code: "ESP",
    category_name: "Microcontrollers",
  },
  {
    id: "p-006",
    mpn: "SN74LVC1G08DBVR",
    manufacturer_id: "m-002",
    description: "Single 2-Input AND Gate, 1.65-5.5V, SOT-23-5",
    category_id: "c-004",
    package_info: "SOT-23-5",
    specs: { channels: 1, voltage: "1.65-5.5V" },
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: true,
    risk_score: 8,
    risk_level: "Low",
    inventory_stock: 50000,
    created_at: "2024-07-15T00:00:00Z",
    manufacturer_name: "Texas Instruments",
    manufacturer_code: "TI",
    category_name: "Logic ICs",
  },
  {
    id: "p-007",
    mpn: "ADS1115IDGSR",
    manufacturer_id: "m-002",
    description: "16-Bit ADC, 4-Channel, 860SPS, I2C, MSOP-10",
    category_id: "c-003",
    package_info: "MSOP-10",
    specs: { resolution: "16-bit", channels: 4 },
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    risk_score: 18,
    risk_level: "Low",
    inventory_stock: 3200,
    created_at: "2024-09-05T00:00:00Z",
    manufacturer_name: "Texas Instruments",
    manufacturer_code: "TI",
    category_name: "Analog ICs",
  },
  {
    id: "p-008",
    mpn: "IRLML6344TRPBF",
    manufacturer_id: "m-005",
    description: "N-Channel MOSFET, 30V, 5A, SOT-23",
    category_id: "c-005",
    package_info: "SOT-23",
    specs: { vds: "30V", id: "5A" },
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    risk_score: 12,
    risk_level: "Low",
    inventory_stock: 35000,
    created_at: "2024-08-22T00:00:00Z",
    manufacturer_name: "Infineon",
    manufacturer_code: "IFX",
    category_name: "Discrete Semiconductors",
  },
  {
    id: "p-009",
    mpn: "NRF52840-QIAA-R7",
    manufacturer_id: "m-006",
    description: "BLE 5.0 SoC, ARM Cortex-M4F, 1MB Flash, QFN-73",
    category_id: "c-001",
    package_info: "QFN-73",
    specs: { core: "Cortex-M4F", bluetooth: "5.0" },
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    risk_score: 35,
    risk_level: "Medium",
    inventory_stock: 2100,
    created_at: "2024-11-10T00:00:00Z",
    manufacturer_name: "Nordic Semiconductor",
    manufacturer_code: "NORD",
    category_name: "Microcontrollers",
  },
  {
    id: "p-010",
    mpn: "MCP2551-I/SN",
    manufacturer_id: "m-003",
    description: "CAN Bus Transceiver, 1Mbps, SOIC-8",
    category_id: "c-006",
    package_info: "SOIC-8",
    specs: { speed: "1Mbps", protocol: "CAN" },
    lifecycle_status: "NRND",
    rohs: true,
    reach: true,
    aec_q: true,
    risk_score: 55,
    risk_level: "Medium",
    inventory_stock: 1800,
    created_at: "2024-06-20T00:00:00Z",
    manufacturer_name: "Microchip",
    manufacturer_code: "MCHP",
    category_name: "Interface ICs",
  },
  {
    id: "p-011",
    mpn: "LTC3588EMSE-1",
    manufacturer_id: "m-007",
    description: "Piezoelectric Energy Harvester, 20V Input, MSOP-10",
    category_id: "c-002",
    package_info: "MSOP-10",
    specs: { input_voltage: "20V", type: "Energy Harvester" },
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    risk_score: 20,
    risk_level: "Low",
    inventory_stock: 900,
    created_at: "2024-10-25T00:00:00Z",
    manufacturer_name: "Analog Devices",
    manufacturer_code: "ADI",
    category_name: "Power Management",
  },
  {
    id: "p-012",
    mpn: "MAX232ECPE+",
    manufacturer_id: "m-007",
    description: "Dual RS-232 Transceiver, 120kbps, DIP-16",
    category_id: "c-006",
    package_info: "DIP-16",
    specs: { speed: "120kbps", channels: 2 },
    lifecycle_status: "NRND",
    rohs: true,
    reach: false,
    aec_q: false,
    risk_score: 62,
    risk_level: "High",
    inventory_stock: 500,
    created_at: "2024-05-12T00:00:00Z",
    manufacturer_name: "Analog Devices",
    manufacturer_code: "ADI",
    category_name: "Interface ICs",
  },
  {
    id: "p-013",
    mpn: "BQ24195RGER",
    manufacturer_id: "m-002",
    description: "I2C Battery Charger, 4.5A, USB OTG, QFN-24",
    category_id: "c-002",
    package_info: "QFN-24",
    specs: { charge_current: "4.5A", usb_otg: true },
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    risk_score: 14,
    risk_level: "Low",
    inventory_stock: 7800,
    created_at: "2024-09-30T00:00:00Z",
    manufacturer_name: "Texas Instruments",
    manufacturer_code: "TI",
    category_name: "Power Management",
  },
  {
    id: "p-014",
    mpn: "W25Q128JVSIQ",
    manufacturer_id: "m-008",
    description: "128Mbit Serial NOR Flash, SPI/QSPI, SOIC-8",
    category_id: "c-007",
    package_info: "SOIC-8",
    specs: { capacity: "128Mbit", interface: "SPI/QSPI" },
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    risk_score: 25,
    risk_level: "Low",
    inventory_stock: 15000,
    created_at: "2024-10-10T00:00:00Z",
    manufacturer_name: "Winbond",
    manufacturer_code: "WBD",
    category_name: "Memory",
  },
  {
    id: "p-015",
    mpn: "MC34063ADR",
    manufacturer_id: "m-009",
    description: "DC-DC Converter Controller, 1.5A, 40V, SOIC-8",
    category_id: "c-002",
    package_info: "SOIC-8",
    specs: { current: "1.5A", max_voltage: "40V" },
    lifecycle_status: "EOL",
    rohs: true,
    reach: true,
    aec_q: false,
    risk_score: 78,
    risk_level: "High",
    inventory_stock: 320,
    created_at: "2024-04-01T00:00:00Z",
    manufacturer_name: "ON Semiconductor",
    manufacturer_code: "ONNN",
    category_name: "Power Management",
  },
  {
    id: "p-016",
    mpn: "STM32F103C8T6",
    manufacturer_id: "m-001",
    description: "ARM Cortex-M3 MCU, 72MHz, 64KB Flash, 20KB RAM, LQFP-48",
    category_id: "c-001",
    package_info: "LQFP-48",
    specs: { core: "Cortex-M3", flash: "64KB", ram: "20KB" },
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    risk_score: 30,
    risk_level: "Medium",
    inventory_stock: 11000,
    created_at: "2024-08-15T00:00:00Z",
    manufacturer_name: "STMicroelectronics",
    manufacturer_code: "STM",
    category_name: "Microcontrollers",
  },
  {
    id: "p-017",
    mpn: "AD8232ACPZ",
    manufacturer_id: "m-007",
    description: "Single-Lead Heart Rate Monitor, LFCSP-20",
    category_id: "c-003",
    package_info: "LFCSP-20",
    specs: { type: "Heart Rate Monitor", supply: "3.3V" },
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: false,
    risk_score: 19,
    risk_level: "Low",
    inventory_stock: 2400,
    created_at: "2024-09-12T00:00:00Z",
    manufacturer_name: "Analog Devices",
    manufacturer_code: "ADI",
    category_name: "Analog ICs",
  },
  {
    id: "p-018",
    mpn: "CD4017BE",
    manufacturer_id: "m-002",
    description: "Decade Counter/Divider, CMOS, DIP-16",
    category_id: "c-004",
    package_info: "DIP-16",
    specs: { type: "Counter", family: "CMOS 4000" },
    lifecycle_status: "Obsolete",
    rohs: true,
    reach: false,
    aec_q: false,
    risk_score: 92,
    risk_level: "Critical",
    inventory_stock: 150,
    created_at: "2024-03-10T00:00:00Z",
    manufacturer_name: "Texas Instruments",
    manufacturer_code: "TI",
    category_name: "Logic ICs",
  },
  {
    id: "p-019",
    mpn: "TLV1117-33IDCYR",
    manufacturer_id: "m-002",
    description: "800mA LDO Regulator, 3.3V Output, SOT-223",
    category_id: "c-002",
    package_info: "SOT-223",
    specs: { output_voltage: "3.3V", current: "800mA" },
    lifecycle_status: "Active",
    rohs: true,
    reach: true,
    aec_q: true,
    risk_score: 9,
    risk_level: "Low",
    inventory_stock: 42000,
    created_at: "2024-07-20T00:00:00Z",
    manufacturer_name: "Texas Instruments",
    manufacturer_code: "TI",
    category_name: "Power Management",
  },
  {
    id: "p-020",
    mpn: "MMBT2222A",
    manufacturer_id: "m-009",
    description: "NPN Transistor, 40V, 600mA, SOT-23",
    category_id: "c-005",
    package_info: "SOT-23",
    specs: { vce: "40V", ic: "600mA" },
    lifecycle_status: "NRND",
    rohs: true,
    reach: true,
    aec_q: false,
    risk_score: 48,
    risk_level: "Medium",
    inventory_stock: 60000,
    created_at: "2024-06-05T00:00:00Z",
    manufacturer_name: "ON Semiconductor",
    manufacturer_code: "ONNN",
    category_name: "Discrete Semiconductors",
  },
];

const mockAlerts: Alert[] = [
  {
    id: "a-001",
    title: "EOL Notice: MC34063ADR",
    description:
      "ON Semiconductor has issued an End-of-Life notice for MC34063ADR. Last-time buy date is March 2025. 5 BOMs are affected.",
    severity: "critical",
    part_id: "p-015",
    action_url: "/parts/p-015",
    created_at: "2025-01-28T10:00:00Z",
  },
  {
    id: "a-002",
    title: "Obsolete Part in Active BOM: CD4017BE",
    description:
      "CD4017BE is marked Obsolete and is used in 2 active assemblies. Identify cross-references immediately.",
    severity: "critical",
    part_id: "p-018",
    action_url: "/parts/p-018",
    created_at: "2025-01-27T14:30:00Z",
  },
  {
    id: "a-003",
    title: "Lead Time Increase: NRF52840-QIAA-R7",
    description:
      "Average lead time for NRF52840 has increased from 12 weeks to 22 weeks across all distributors.",
    severity: "warning",
    part_id: "p-009",
    action_url: "/parts/p-009",
    created_at: "2025-01-26T09:15:00Z",
  },
  {
    id: "a-004",
    title: "Low Stock Alert: LTC3588EMSE-1",
    description:
      "Inventory for LTC3588EMSE-1 has dropped below the minimum threshold of 1,000 units. Current stock: 900.",
    severity: "warning",
    part_id: "p-011",
    action_url: "/parts/p-011",
    created_at: "2025-01-25T16:45:00Z",
  },
  {
    id: "a-005",
    title: "New PCN: MAX232ECPE+ Package Update",
    description:
      "Analog Devices issued PCN for MAX232ECPE+ regarding lead-frame material change. Review for compliance impact.",
    severity: "info",
    part_id: "p-012",
    action_url: "/parts/p-012",
    created_at: "2025-01-24T11:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Chart data
// ---------------------------------------------------------------------------

const riskDistributionData = [
  { name: "Low", value: 14 },
  { name: "Medium", value: 3 },
  { name: "High", value: 2 },
  { name: "Critical", value: 1 },
];

const lifecycleStatusData = [
  { name: "Active", value: 15 },
  { name: "NRND", value: 3 },
  { name: "EOL", value: 1 },
  { name: "Obsolete", value: 1 },
];

const topCategoriesData = [
  { name: "Microcontrollers", count: 12 },
  { name: "Power Mgmt", count: 10 },
  { name: "Analog ICs", count: 8 },
  { name: "Interface ICs", count: 6 },
  { name: "Logic ICs", count: 5 },
  { name: "Discrete", count: 4 },
  { name: "Memory", count: 3 },
];

const RISK_COLORS = ["#10b981", "#f59e0b", "#f97316", "#ef4444"];
const LIFECYCLE_COLORS = ["#10b981", "#f59e0b", "#f97316", "#ef4444"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function getRiskBarColor(score: number): string {
  if (score < 30) return "bg-emerald-500";
  if (score < 60) return "bg-amber-500";
  if (score < 80) return "bg-orange-500";
  return "bg-red-500";
}

function getLifecycleBadgeClasses(status: LifecycleStatus): string {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "NRND":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "EOL":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "Obsolete":
      return "bg-red-100 text-red-700 border-red-200";
  }
}

function getCategoryBadgeClasses(category: string): string {
  const map: Record<string, string> = {
    Microcontrollers: "bg-blue-100 text-blue-700 border-blue-200",
    "Power Management": "bg-violet-100 text-violet-700 border-violet-200",
    "Analog ICs": "bg-cyan-100 text-cyan-700 border-cyan-200",
    "Logic ICs": "bg-indigo-100 text-indigo-700 border-indigo-200",
    "Interface ICs": "bg-pink-100 text-pink-700 border-pink-200",
    "Discrete Semiconductors": "bg-teal-100 text-teal-700 border-teal-200",
    Memory: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };
  return map[category] ?? "bg-slate-100 text-slate-700 border-slate-200";
}

function getSeverityBadgeClasses(severity: AlertSeverity): string {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-700 border-red-200";
    case "warning":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "info":
      return "bg-blue-100 text-blue-700 border-blue-200";
  }
}

function getSeverityIcon(severity: AlertSeverity) {
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

const columns: ColumnDef<PartWithRelations>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "mpn",
    header: "Part Number",
    cell: ({ row }) => (
      <div className="min-w-[180px]">
        <Link
          href={`/parts/${row.original.id}`}
          className="font-semibold text-blue-600 hover:underline"
        >
          {row.original.mpn}
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
          {row.original.description}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "manufacturer_name",
    header: "Manufacturer",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="text-sm">{row.original.manufacturer_name}</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {row.original.manufacturer_code}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "category_name",
    header: "Category",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={getCategoryBadgeClasses(row.original.category_name)}
      >
        {row.original.category_name}
      </Badge>
    ),
  },
  {
    accessorKey: "inventory_stock",
    header: "Inventory",
    cell: ({ row }) => (
      <span className="tabular-nums text-sm">
        {formatNumber(row.original.inventory_stock)}
      </span>
    ),
  },
  {
    accessorKey: "risk_score",
    header: "Risk Score",
    cell: ({ row }) => {
      const score = row.original.risk_score;
      return (
        <div className="flex items-center gap-2 min-w-[120px]">
          <div className="relative h-2 w-16 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`absolute inset-y-0 left-0 rounded-full ${getRiskBarColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="text-xs font-medium tabular-nums">{score}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "lifecycle_status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={getLifecycleBadgeClasses(row.original.lifecycle_status)}
      >
        {row.original.lifecycle_status}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Button variant="ghost" size="xs" asChild>
        <Link href={`/parts/${row.original.id}`}>
          <Eye className="size-3.5" />
          View
        </Link>
      </Button>
    ),
    enableSorting: false,
  },
];

// ---------------------------------------------------------------------------
// Quick action data
// ---------------------------------------------------------------------------

const quickActions = [
  {
    title: "Smart Search",
    description:
      "Search across parts, manufacturers, and specs with parametric filters.",
    icon: Search,
    href: "/parts",
  },
  {
    title: "Import BOM",
    description:
      "Upload a Bill of Materials file to auto-match parts and check availability.",
    icon: Upload,
    href: "/assemblies",
  },
  {
    title: "Risk Analysis",
    description:
      "Run a supply-chain risk assessment across your active component portfolio.",
    icon: ShieldAlert,
    href: "/risk",
  },
  {
    title: "Price Tracking",
    description:
      "Monitor real-time pricing trends and set alerts for cost changes.",
    icon: TrendingUp,
    href: "/market",
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function PartsLibraryPage() {
  return (
    <div className="space-y-8">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Page header                                                    */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Parts Database</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage and monitor your electronic component inventory
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. KPI cards                                                      */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          title="Total Parts"
          value="1,247"
          subtitle="In component library"
          trend={{ value: 12, positive: true }}
          icon={Package}
        />
        <KpiCard
          title="Active BOMs"
          value={23}
          subtitle="Across 8 programs"
          trend={{ value: 3, positive: true }}
          icon={FileStack}
        />
        <KpiCard
          title="At Risk Parts"
          value={18}
          subtitle="Requires attention"
          trend={{ value: 5, positive: true }}
          icon={AlertTriangle}
        />
        <KpiCard
          title="Avg Lead Time"
          value="8.5 wks"
          subtitle="Across all suppliers"
          trend={{ value: 2, positive: false }}
          icon={Clock}
        />
        <KpiCard
          title="Total Inventory Value"
          value="$2.4M"
          subtitle="Current valuation"
          trend={{ value: 8, positive: true }}
          icon={DollarSign}
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Main data table                                                */}
      {/* ----------------------------------------------------------------- */}
      <Card className="gap-0 py-0">
        <CardHeader className="pb-4 pt-5">
          <CardTitle className="text-base">Component Inventory</CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <DataTable
            columns={columns}
            data={mockParts}
            searchKey="mpn"
            searchPlaceholder="Search part numbers..."
          />
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Summary charts row                                             */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Risk Distribution */}
        <ChartContainer
          title="Risk Distribution"
          subtitle="Parts by risk level"
          height={260}
        >
          <PieChart>
            <Pie
              data={riskDistributionData}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              nameKey="name"
              label={({ name, value }) => `${name}: ${value}`}
              labelLine={false}
              fontSize={12}
            >
              {riskDistributionData.map((_, index) => (
                <Cell
                  key={`risk-${index}`}
                  fill={RISK_COLORS[index]}
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

        {/* Lifecycle Status */}
        <ChartContainer
          title="Lifecycle Status"
          subtitle="Parts by lifecycle stage"
          height={260}
        >
          <PieChart>
            <Pie
              data={lifecycleStatusData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              dataKey="value"
              nameKey="name"
              label={({ name, value }) => `${name}: ${value}`}
              labelLine={false}
              fontSize={12}
            >
              {lifecycleStatusData.map((_, index) => (
                <Cell
                  key={`lc-${index}`}
                  fill={LIFECYCLE_COLORS[index]}
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

        {/* Top Categories */}
        <ChartContainer
          title="Top Categories"
          subtitle="Parts by component category"
          height={260}
        >
          <BarChart
            data={topCategoriesData}
            layout="vertical"
            margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
          >
            <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip />
            <Bar
              dataKey="count"
              fill="#3b82f6"
              radius={[0, 4, 4, 0]}
              barSize={18}
            />
          </BarChart>
        </ChartContainer>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 5. Critical Alerts                                                */}
      {/* ----------------------------------------------------------------- */}
      <Card className="gap-0 py-0">
        <CardHeader className="pb-2 pt-5">
          <CardTitle className="text-base">Critical Alerts</CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="divide-y">
            {mockAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="mt-0.5 shrink-0">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
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
                </div>
                <Button variant="ghost" size="xs" asChild className="shrink-0">
                  <Link href={alert.action_url}>View</Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 6. Quick Action cards                                             */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="group gap-0 py-0 transition-colors hover:border-blue-200 hover:bg-blue-50/40">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                  <action.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{action.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
