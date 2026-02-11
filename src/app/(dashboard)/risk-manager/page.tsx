"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Bell,
  Shield,
  Globe,
  Cpu,
  Clock,
  Package,
  FileWarning,
  MapPin,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FlaggedComponent {
  rank: number;
  mpn: string;
  manufacturer: string;
  risk_score: number;
  risk_level: "Critical" | "High" | "Medium" | "Low";
  risk_factors: string[];
  affected_assemblies: number;
}

interface GeoRiskPart {
  mpn: string;
  country: string;
  risk_type: string;
  risk_score: number;
  affected_assemblies: number;
}

interface PcnEntry {
  id: string;
  title: string;
  description: string;
  change_type: "EOL" | "NRND" | "Obsolescence" | "Material Change";
  effective_date: string;
  mpn: string;
  severity: "Critical" | "High" | "Medium" | "Low";
}

interface AlertEntry {
  id: string;
  severity: "Critical" | "Warning" | "Info";
  title: string;
  description: string;
  mpn: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const flaggedComponents: FlaggedComponent[] = [
  {
    rank: 1,
    mpn: "MC34063ADR",
    manufacturer: "Texas Instruments",
    risk_score: 92,
    risk_level: "Critical",
    risk_factors: ["EOL", "Single Source"],
    affected_assemblies: 14,
  },
  {
    rank: 2,
    mpn: "LM2596S-5.0",
    manufacturer: "Texas Instruments",
    risk_score: 78,
    risk_level: "Critical",
    risk_factors: ["NRND", "Long Lead Time"],
    affected_assemblies: 9,
  },
  {
    rank: 3,
    mpn: "ATMega328P-AU",
    manufacturer: "Microchip",
    risk_score: 65,
    risk_level: "High",
    risk_factors: ["Single Source", "Geopolitical"],
    affected_assemblies: 11,
  },
  {
    rank: 4,
    mpn: "LPC1768FBD100",
    manufacturer: "NXP Semiconductors",
    risk_score: 55,
    risk_level: "High",
    risk_factors: ["EOL", "Quality"],
    affected_assemblies: 6,
  },
  {
    rank: 5,
    mpn: "ATSAMD21G18A-AUT",
    manufacturer: "Microchip",
    risk_score: 30,
    risk_level: "Medium",
    risk_factors: ["Long Lead Time"],
    affected_assemblies: 8,
  },
  {
    rank: 6,
    mpn: "LMZ31710RVQR",
    manufacturer: "Texas Instruments",
    risk_score: 25,
    risk_level: "Medium",
    risk_factors: ["Single Source"],
    affected_assemblies: 4,
  },
  {
    rank: 7,
    mpn: "ESP32-WROOM-32D",
    manufacturer: "Espressif",
    risk_score: 22,
    risk_level: "Low",
    risk_factors: ["Geopolitical"],
    affected_assemblies: 7,
  },
  {
    rank: 8,
    mpn: "STM32F103C8T6",
    manufacturer: "STMicroelectronics",
    risk_score: 20,
    risk_level: "Low",
    risk_factors: ["Supply Disruption"],
    affected_assemblies: 12,
  },
  {
    rank: 9,
    mpn: "STM32F407VGT6",
    manufacturer: "STMicroelectronics",
    risk_score: 15,
    risk_level: "Low",
    risk_factors: ["Long Lead Time"],
    affected_assemblies: 3,
  },
  {
    rank: 10,
    mpn: "ADS1115IDGSR",
    manufacturer: "Texas Instruments",
    risk_score: 14,
    risk_level: "Low",
    risk_factors: ["Quality"],
    affected_assemblies: 2,
  },
];

const riskScoreTrend = [
  { month: "Jul", score: 38 },
  { month: "Aug", score: 41 },
  { month: "Sep", score: 39 },
  { month: "Oct", score: 44 },
  { month: "Nov", score: 48 },
  { month: "Dec", score: 52 },
];

const geoRiskParts: GeoRiskPart[] = [
  { mpn: "ESP32-WROOM-32D", country: "China", risk_type: "Geopolitical", risk_score: 72, affected_assemblies: 7 },
  { mpn: "ATMega328P-AU", country: "Thailand", risk_type: "Supply Disruption", risk_score: 65, affected_assemblies: 11 },
  { mpn: "MC34063ADR", country: "Taiwan", risk_type: "Geopolitical", risk_score: 58, affected_assemblies: 14 },
  { mpn: "LPC1768FBD100", country: "Netherlands", risk_type: "Single Source", risk_score: 55, affected_assemblies: 6 },
  { mpn: "STM32F103C8T6", country: "China", risk_type: "Supply Disruption", risk_score: 48, affected_assemblies: 12 },
  { mpn: "LM2596S-5.0", country: "Malaysia", risk_type: "EOL", risk_score: 44, affected_assemblies: 9 },
  { mpn: "ATSAMD21G18A-AUT", country: "USA", risk_type: "Single Source", risk_score: 30, affected_assemblies: 8 },
  { mpn: "LMZ31710RVQR", country: "Mexico", risk_type: "Quality", risk_score: 25, affected_assemblies: 4 },
];

const eventTypeDistribution = [
  { type: "Supply Disruption", count: 12 },
  { type: "EOL", count: 8 },
  { type: "Single Source", count: 15 },
  { type: "Geopolitical", count: 6 },
  { type: "Quality", count: 4 },
];

const pcnEntries: PcnEntry[] = [
  {
    id: "PCN-2024-001",
    title: "End of Life Notice - MC34063ADR",
    description:
      "Texas Instruments has announced the end of life for the MC34063ADR DC-DC converter. Last time buy date is March 2025. Recommended replacement: TPS5430DDAR.",
    change_type: "EOL",
    effective_date: "2025-03-15",
    mpn: "MC34063ADR",
    severity: "Critical",
  },
  {
    id: "PCN-2024-002",
    title: "Not Recommended for New Designs - LM2596S-5.0",
    description:
      "LM2596S-5.0 has been moved to NRND status. Production will continue for existing orders but no new designs should incorporate this part. Consider LMR33630ADDAR as alternative.",
    change_type: "NRND",
    effective_date: "2024-12-01",
    mpn: "LM2596S-5.0",
    severity: "High",
  },
  {
    id: "PCN-2024-003",
    title: "Obsolescence Notice - LPC1768FBD100",
    description:
      "NXP Semiconductors has declared the LPC1768FBD100 obsolete effective immediately. All remaining stock is final. Transition to LPC55S69 recommended.",
    change_type: "Obsolescence",
    effective_date: "2024-11-20",
    mpn: "LPC1768FBD100",
    severity: "Critical",
  },
  {
    id: "PCN-2024-004",
    title: "Material Change - STM32F103C8T6",
    description:
      "STMicroelectronics is updating the die revision for the STM32F103C8T6 from Rev Z to Rev Y. Electrical characteristics remain unchanged. Package marking will be updated.",
    change_type: "Material Change",
    effective_date: "2025-01-10",
    mpn: "STM32F103C8T6",
    severity: "Low",
  },
  {
    id: "PCN-2024-005",
    title: "End of Life Notice - ATMega328P-AU",
    description:
      "Microchip has announced the ATMega328P-AU will reach end of life. Last time buy date is June 2025. Recommended migration path: AVR128DA48.",
    change_type: "EOL",
    effective_date: "2025-06-30",
    mpn: "ATMega328P-AU",
    severity: "High",
  },
];

const alertEntries: AlertEntry[] = [
  {
    id: "ALT-001",
    severity: "Critical",
    title: "EOL Notice Received",
    description: "MC34063ADR has received an official end-of-life notification from Texas Instruments. Immediate action required to secure last-time-buy quantities.",
    mpn: "MC34063ADR",
    timestamp: "2024-12-10T09:15:00Z",
  },
  {
    id: "ALT-002",
    severity: "Critical",
    title: "Obsolescence Alert",
    description: "LPC1768FBD100 declared obsolete by NXP. No further production planned. Begin transition to alternative immediately.",
    mpn: "LPC1768FBD100",
    timestamp: "2024-12-09T14:30:00Z",
  },
  {
    id: "ALT-003",
    severity: "Warning",
    title: "Supply Disruption Detected",
    description: "Lead times for STM32F103C8T6 have increased from 12 to 26 weeks. Multiple distributors reporting allocation restrictions.",
    mpn: "STM32F103C8T6",
    timestamp: "2024-12-08T11:00:00Z",
  },
  {
    id: "ALT-004",
    severity: "Warning",
    title: "NRND Status Change",
    description: "LM2596S-5.0 has moved to Not Recommended for New Designs. Evaluate alternatives for upcoming projects.",
    mpn: "LM2596S-5.0",
    timestamp: "2024-12-07T08:45:00Z",
  },
  {
    id: "ALT-005",
    severity: "Warning",
    title: "Geopolitical Risk Escalation",
    description: "New trade restrictions may impact supply of ESP32-WROOM-32D sourced from affected region. Monitor situation and prepare contingency.",
    mpn: "ESP32-WROOM-32D",
    timestamp: "2024-12-06T16:20:00Z",
  },
  {
    id: "ALT-006",
    severity: "Info",
    title: "Material Change Notification",
    description: "STM32F103C8T6 die revision update from Rev Z to Rev Y. No impact on electrical specifications.",
    mpn: "STM32F103C8T6",
    timestamp: "2024-12-05T10:00:00Z",
  },
  {
    id: "ALT-007",
    severity: "Info",
    title: "Lead Time Improvement",
    description: "ADS1115IDGSR lead times have returned to normal (8 weeks). Distributor stock levels recovering.",
    mpn: "ADS1115IDGSR",
    timestamp: "2024-12-04T13:30:00Z",
  },
  {
    id: "ALT-008",
    severity: "Info",
    title: "New Cross-Reference Available",
    description: "Alternative source identified for ATSAMD21G18A-AUT from secondary manufacturer. Qualification pending.",
    mpn: "ATSAMD21G18A-AUT",
    timestamp: "2024-12-03T09:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function riskLevelColor(level: string) {
  switch (level) {
    case "Critical":
      return "bg-red-100 text-red-700 border-red-200";
    case "High":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "Medium":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "Low":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function riskScoreBarColor(score: number) {
  if (score >= 75) return "bg-red-500";
  if (score >= 50) return "bg-orange-500";
  if (score >= 25) return "bg-yellow-500";
  return "bg-green-500";
}

function severityColor(severity: string) {
  switch (severity) {
    case "Critical":
      return "bg-red-100 text-red-700 border-red-200";
    case "Warning":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Info":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function changeTypeBadgeColor(type: string) {
  switch (type) {
    case "EOL":
      return "bg-red-100 text-red-700 border-red-200";
    case "NRND":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Obsolescence":
      return "bg-red-100 text-red-700 border-red-200";
    case "Material Change":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Table Column Definitions
// ---------------------------------------------------------------------------

const flaggedColumns: ColumnDef<FlaggedComponent, unknown>[] = [
  {
    accessorKey: "rank",
    header: "#",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.rank}</span>
    ),
  },
  {
    accessorKey: "mpn",
    header: "Part Number",
    cell: ({ row }) => (
      <span className="font-bold font-mono text-sm">{row.original.mpn}</span>
    ),
  },
  {
    accessorKey: "manufacturer",
    header: "Manufacturer",
  },
  {
    accessorKey: "risk_score",
    header: "Risk Score",
    cell: ({ row }) => {
      const score = row.original.risk_score;
      return (
        <div className="flex items-center gap-2 min-w-[120px]">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${riskScoreBarColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="text-sm font-medium w-8 text-right">{score}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "risk_level",
    header: "Risk Level",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={riskLevelColor(row.original.risk_level)}
      >
        {row.original.risk_level}
      </Badge>
    ),
  },
  {
    accessorKey: "risk_factors",
    header: "Risk Factors",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.risk_factors.map((factor) => (
          <Badge key={factor} variant="secondary" className="text-xs">
            {factor}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "affected_assemblies",
    header: "Affected Assemblies",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.affected_assemblies}</span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <Button variant="outline" size="sm">
        Mitigate
      </Button>
    ),
  },
];

const geoRiskColumns: ColumnDef<GeoRiskPart, unknown>[] = [
  {
    accessorKey: "mpn",
    header: "Part Number",
    cell: ({ row }) => (
      <span className="font-bold font-mono text-sm">{row.original.mpn}</span>
    ),
  },
  {
    accessorKey: "country",
    header: "Country",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <MapPin className="size-3.5 text-muted-foreground" />
        <span>{row.original.country}</span>
      </div>
    ),
  },
  {
    accessorKey: "risk_type",
    header: "Risk Type",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.risk_type}</Badge>
    ),
  },
  {
    accessorKey: "risk_score",
    header: "Risk Score",
    cell: ({ row }) => {
      const score = row.original.risk_score;
      return (
        <div className="flex items-center gap-2 min-w-[120px]">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${riskScoreBarColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="text-sm font-medium w-8 text-right">{score}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "affected_assemblies",
    header: "Affected Assemblies",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.affected_assemblies}</span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Risk Category Cards Data
// ---------------------------------------------------------------------------

const riskCategories = [
  {
    title: "Supply Chain",
    count: 7,
    icon: Package,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Lifecycle",
    count: 5,
    icon: Clock,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Geopolitical",
    count: 4,
    icon: Globe,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Quality",
    count: 3,
    icon: Shield,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
];

const regionalExposure = [
  {
    region: "Asia-Pacific",
    parts: 8,
    riskLevel: "High" as const,
    countries: ["China", "Taiwan", "Thailand", "Malaysia"],
  },
  {
    region: "Europe",
    parts: 5,
    riskLevel: "Medium" as const,
    countries: ["Netherlands", "Germany", "France"],
  },
  {
    region: "Americas",
    parts: 7,
    riskLevel: "Low" as const,
    countries: ["USA", "Mexico"],
  },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function RiskManagerPage() {
  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Risk Manager</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and mitigate supply chain risks across your component portfolio
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* KPI Cards                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Critical"
          value={2}
          icon={AlertOctagon}
          className="[&_div.flex.size-11]:bg-red-50 [&_div.flex.size-11]:text-red-600"
        />
        <KpiCard
          title="High"
          value={3}
          icon={AlertTriangle}
          className="[&_div.flex.size-11]:bg-orange-50 [&_div.flex.size-11]:text-orange-600"
        />
        <KpiCard
          title="Medium"
          value={5}
          icon={AlertCircle}
          className="[&_div.flex.size-11]:bg-yellow-50 [&_div.flex.size-11]:text-yellow-600"
        />
        <KpiCard
          title="Low"
          value={10}
          icon={CheckCircle}
          className="[&_div.flex.size-11]:bg-green-50 [&_div.flex.size-11]:text-green-600"
        />
        <KpiCard title="Active Alerts" value={8} icon={Bell} />
      </div>

      <Separator />

      {/* ----------------------------------------------------------------- */}
      {/* Tabs                                                              */}
      {/* ----------------------------------------------------------------- */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="georisk">GeoRisk</TabsTrigger>
          <TabsTrigger value="pcns">PCNs</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* ----- Overview Tab ----- */}
        <TabsContent value="overview" className="space-y-6 pt-4">
          {/* Risk Category Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {riskCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Card key={cat.title} className="gap-0 py-0">
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-10 items-center justify-center rounded-lg ${cat.bg}`}
                      >
                        <Icon className={`size-5 ${cat.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{cat.title}</p>
                        <p className="text-2xl font-bold">{cat.count}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Risk Score Distribution */}
          <ChartContainer
            title="Risk Score Distribution"
            subtitle="Average portfolio risk score over the last 6 months"
            height={300}
          >
            <AreaChart data={riskScoreTrend}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "13px",
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#riskGrad)"
                name="Risk Score"
              />
            </AreaChart>
          </ChartContainer>

          {/* Flagged Components Table */}
          <Card className="gap-0 py-0">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-base">Flagged Components</CardTitle>
              <CardDescription>
                Top 10 components ranked by risk score
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-5 pt-2">
              <DataTable
                columns={flaggedColumns}
                data={flaggedComponents}
                searchKey="mpn"
                searchPlaceholder="Search part numbers..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----- GeoRisk Tab ----- */}
        <TabsContent value="georisk" className="space-y-6 pt-4">
          {/* Regional Exposure */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Regional Exposure</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {regionalExposure.map((region) => (
                <Card key={region.region} className="gap-0 py-0">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="size-5 text-muted-foreground" />
                        <h3 className="font-semibold">{region.region}</h3>
                      </div>
                      <Badge
                        variant="outline"
                        className={riskLevelColor(region.riskLevel)}
                      >
                        {region.riskLevel}
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        {region.parts}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        parts at risk
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {region.countries.map((c) => (
                        <Badge key={c} variant="secondary" className="text-xs">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Event Type Distribution */}
          <ChartContainer
            title="Event Type Distribution"
            subtitle="Count of risk events by category"
            height={300}
          >
            <BarChart data={eventTypeDistribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="type"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "13px",
                }}
              />
              <Bar
                dataKey="count"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                name="Events"
              />
            </BarChart>
          </ChartContainer>

          {/* At-Risk Parts Table */}
          <Card className="gap-0 py-0">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-base">At-Risk Parts</CardTitle>
              <CardDescription>
                Components with geographic risk exposure
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-5 pt-2">
              <DataTable
                columns={geoRiskColumns}
                data={geoRiskParts}
                searchKey="mpn"
                searchPlaceholder="Search part numbers..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----- PCNs Tab ----- */}
        <TabsContent value="pcns" className="space-y-6 pt-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">
              Product Change Notifications
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Recent PCNs affecting your component portfolio
            </p>
          </div>

          <div className="space-y-4">
            {pcnEntries.map((pcn) => (
              <Card key={pcn.id} className="gap-0 py-0">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileWarning className="size-4 text-muted-foreground shrink-0" />
                        <h3 className="font-semibold text-sm">
                          {pcn.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={changeTypeBadgeColor(pcn.change_type)}
                        >
                          {pcn.change_type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={riskLevelColor(pcn.severity)}
                        >
                          {pcn.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pcn.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Cpu className="size-3" />
                          {pcn.mpn}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          Effective: {pcn.effective_date}
                        </span>
                        <span className="text-muted-foreground">
                          {pcn.id}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ----- Alerts Tab ----- */}
        <TabsContent value="alerts" className="space-y-6 pt-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Active Alerts</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {alertEntries.length} alerts requiring attention
            </p>
          </div>

          {/* Group by severity */}
          {(["Critical", "Warning", "Info"] as const).map((severity) => {
            const group = alertEntries.filter((a) => a.severity === severity);
            if (group.length === 0) return null;
            return (
              <div key={severity} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {severity} ({group.length})
                </h3>
                <div className="space-y-3">
                  {group.map((alert) => (
                    <Card key={alert.id} className="gap-0 py-0">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className={severityColor(alert.severity)}
                              >
                                {alert.severity}
                              </Badge>
                              <h3 className="font-semibold text-sm">
                                {alert.title}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {alert.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Cpu className="size-3" />
                                {alert.mpn}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {formatTimestamp(alert.timestamp)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button variant="outline" size="sm">
                              Acknowledge
                            </Button>
                            <Button variant="ghost" size="sm">
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
