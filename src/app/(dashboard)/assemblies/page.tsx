"use client";

import { useState, useCallback } from "react";
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
  Upload,
  FileSpreadsheet,
  Package,
  Layers,
  Hash,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  Plus,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseBomFile, type ParsedBom, type BomLineItem } from "@/lib/bom-parser";

// ---------------------------------------------------------------------------
// Mock existing assemblies
// ---------------------------------------------------------------------------

interface AssemblyRow {
  id: string;
  name: string;
  customer: string;
  status: string;
  partsCount: number;
  totalQty: number;
  created_at: string;
}

const mockAssemblies: AssemblyRow[] = [
  {
    id: "asm-1",
    name: "Power Inverter Board v2.1",
    customer: "AutoDrive GmbH",
    status: "Active",
    partsCount: 87,
    totalQty: 342,
    created_at: "2026-01-15",
  },
  {
    id: "asm-2",
    name: "Sensor Module REV-C",
    customer: "MedTech Solutions",
    status: "Active",
    partsCount: 43,
    totalQty: 156,
    created_at: "2026-01-22",
  },
  {
    id: "asm-3",
    name: "Motor Controller PCB",
    customer: "E-Motion Corp",
    status: "Draft",
    partsCount: 124,
    totalQty: 589,
    created_at: "2026-02-03",
  },
];

// ---------------------------------------------------------------------------
// Assembly table columns
// ---------------------------------------------------------------------------

const assemblyColumns: ColumnDef<AssemblyRow>[] = [
  {
    accessorKey: "name",
    header: "Assembly Name",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        <p className="text-xs text-muted-foreground">{row.original.customer}</p>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          className={
            status === "Active"
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "partsCount",
    header: "Line Items",
    cell: ({ row }) => row.original.partsCount.toLocaleString(),
  },
  {
    accessorKey: "totalQty",
    header: "Total Qty",
    cell: ({ row }) => row.original.totalQty.toLocaleString(),
  },
  {
    accessorKey: "created_at",
    header: "Created",
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" className="gap-1.5">
          <Eye className="size-3.5" />
          View
        </Button>
        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600">
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// BOM preview table columns
// ---------------------------------------------------------------------------

const bomPreviewColumns: ColumnDef<BomLineItem>[] = [
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
      const s = row.original.supplier1;
      if (!s) return <span className="text-muted-foreground">-</span>;
      return (
        <div>
          <p className="text-sm font-medium">{s.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{s.orderNumber}</p>
        </div>
      );
    },
  },
  {
    id: "supplier2",
    header: "Supplier 2",
    cell: ({ row }) => {
      const s = row.original.supplier2;
      if (!s) return <span className="text-muted-foreground">-</span>;
      return (
        <div>
          <p className="text-sm font-medium">{s.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{s.orderNumber}</p>
        </div>
      );
    },
  },
];

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
// Page component
// ---------------------------------------------------------------------------

export default function AssembliesPage() {
  const [assemblies, setAssemblies] = useState<AssemblyRow[]>(mockAssemblies);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [parsedBom, setParsedBom] = useState<ParsedBom | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // ---- File handling ----

  const handleFile = useCallback((file: File) => {
    setParseError(null);
    setParsedBom(null);
    setImportSuccess(false);

    if (
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls") &&
      !file.name.endsWith(".csv")
    ) {
      setParseError("Unsupported file format. Please upload .xlsx, .xls, or .csv");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const result = parseBomFile(buffer, file.name);
        setParsedBom(result);
      } catch {
        setParseError("Failed to parse the BOM file. Please check the format.");
      }
    };
    reader.onerror = () => {
      setParseError("Failed to read the file.");
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleImport = useCallback(() => {
    if (!parsedBom) return;

    // Add to assemblies list
    const newAssembly: AssemblyRow = {
      id: `asm-${Date.now()}`,
      name: parsedBom.fileName.replace(/\.(xlsx|xls|csv)$/i, ""),
      customer: "-",
      status: "Draft",
      partsCount: parsedBom.totalLines,
      totalQty: parsedBom.totalQuantity,
      created_at: new Date().toISOString().split("T")[0],
    };

    setAssemblies((prev) => [newAssembly, ...prev]);
    setImportSuccess(true);
  }, [parsedBom]);

  const handleCloseDialog = useCallback(() => {
    setUploadOpen(false);
    setParsedBom(null);
    setParseError(null);
    setImportSuccess(false);
  }, []);

  // ---- Chart data derived from parsed BOM ----

  const sectionChartData = parsedBom
    ? parsedBom.sections.map((section) => {
        const sectionItems = parsedBom.items.filter(
          (i) => i.section === section
        );
        return {
          section,
          count: sectionItems.length,
          qty: sectionItems.reduce((sum, i) => sum + i.quantity, 0),
        };
      })
    : [];

  const supplierPieData = parsedBom
    ? (() => {
        const counts: Record<string, number> = {};
        for (const item of parsedBom.items) {
          if (item.supplier1) {
            counts[item.supplier1.name] =
              (counts[item.supplier1.name] || 0) + 1;
          }
          if (item.supplier2) {
            counts[item.supplier2.name] =
              (counts[item.supplier2.name] || 0) + 1;
          }
        }
        return Object.entries(counts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8);
      })()
    : [];

  // ---- KPI values ----

  const totalParts = assemblies.reduce((sum, a) => sum + a.partsCount, 0);
  const totalQty = assemblies.reduce((sum, a) => sum + a.totalQty, 0);
  const activeCount = assemblies.filter((a) => a.status === "Active").length;

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Header                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bill of Materials
          </h1>
          <p className="text-muted-foreground">
            Manage assemblies and import BOM files
          </p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="size-4" />
              Import BOM
            </Button>
          </DialogTrigger>
          <DialogContent
            className={
              parsedBom && !importSuccess
                ? "sm:max-w-4xl max-h-[90vh] overflow-y-auto"
                : "sm:max-w-lg"
            }
          >
            {!parsedBom && !importSuccess && (
              <>
                <DialogHeader>
                  <DialogTitle>Import BOM</DialogTitle>
                  <DialogDescription>
                    Upload an Excel (.xlsx) or CSV file with your Bill of
                    Materials. Expected columns: Value, Shorttext, Qty,
                    Supplier&nbsp;1, Order-#&nbsp;1, Supplier&nbsp;2,
                    Order-#&nbsp;2
                  </DialogDescription>
                </DialogHeader>

                {/* Drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors ${
                    dragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-slate-50/50"
                  }`}
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <FileSpreadsheet className="size-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Drag &amp; drop your BOM file here
                    </p>
                    <p className="text-xs text-muted-foreground">
                      or click to browse
                    </p>
                  </div>
                  <label>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <Button variant="outline" size="sm" asChild>
                      <span>Browse Files</span>
                    </Button>
                  </label>
                </div>

                {parseError && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="size-4 shrink-0" />
                    {parseError}
                  </div>
                )}
              </>
            )}

            {/* ---- Preview parsed BOM ---- */}
            {parsedBom && !importSuccess && (
              <>
                <DialogHeader>
                  <DialogTitle>BOM Preview</DialogTitle>
                  <DialogDescription>
                    Parsed <strong>{parsedBom.fileName}</strong> &mdash;{" "}
                    {parsedBom.totalLines} line items across{" "}
                    {parsedBom.sections.length} sections
                  </DialogDescription>
                </DialogHeader>

                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border bg-slate-50 p-3 text-center">
                    <p className="text-2xl font-bold">{parsedBom.totalLines}</p>
                    <p className="text-xs text-muted-foreground">Line Items</p>
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3 text-center">
                    <p className="text-2xl font-bold">
                      {parsedBom.totalQuantity}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Qty</p>
                  </div>
                  <div className="rounded-lg border bg-slate-50 p-3 text-center">
                    <p className="text-2xl font-bold">
                      {parsedBom.sections.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Sections</p>
                  </div>
                </div>

                {/* Sections breakdown */}
                <div className="flex flex-wrap gap-1.5">
                  {parsedBom.sections.map((s) => (
                    <Badge
                      key={s}
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>

                {/* Preview table */}
                <div className="max-h-[340px] overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Section</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Supplier 1</TableHead>
                        <TableHead>Supplier 2</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedBom.items.slice(0, 50).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">
                              {item.section}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.value || "-"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">
                            {item.shorttext}
                          </TableCell>
                          <TableCell>
                            {item.quantity || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.supplier1 ? (
                              <div>
                                <span className="text-sm">
                                  {item.supplier1.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.supplier2 ? (
                              <span className="text-sm">
                                {item.supplier2.name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parsedBom.items.length > 50 && (
                    <p className="p-2 text-center text-xs text-muted-foreground">
                      Showing first 50 of {parsedBom.items.length} items
                    </p>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setParsedBom(null)}>
                    Back
                  </Button>
                  <Button className="gap-2" onClick={handleImport}>
                    <Plus className="size-4" />
                    Import as Assembly
                  </Button>
                </DialogFooter>
              </>
            )}

            {/* ---- Import success ---- */}
            {importSuccess && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="size-8 text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">BOM Imported</p>
                  <p className="text-sm text-muted-foreground">
                    {parsedBom?.totalLines} line items have been added as a new
                    assembly.
                  </p>
                </div>
                <Button onClick={handleCloseDialog}>Done</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. KPI cards                                                      */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Assemblies"
          value={assemblies.length}
          icon={Layers}
        />
        <KpiCard
          title="Active BOMs"
          value={activeCount}
          icon={FileSpreadsheet}
        />
        <KpiCard
          title="Total Line Items"
          value={totalParts.toLocaleString()}
          icon={Hash}
        />
        <KpiCard
          title="Total Components"
          value={totalQty.toLocaleString()}
          icon={Package}
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Assemblies data table                                          */}
      {/* ----------------------------------------------------------------- */}
      <DataTable
        columns={assemblyColumns}
        data={assemblies}
        searchKey="name"
        searchPlaceholder="Search assemblies..."
      />

      {/* ----------------------------------------------------------------- */}
      {/* 4. Last imported BOM analysis (shown after import)                 */}
      {/* ----------------------------------------------------------------- */}
      {parsedBom && (
        <>
          <div>
            <h2 className="mb-4 text-lg font-semibold tracking-tight">
              Last Import Analysis &mdash; {parsedBom.fileName}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Section breakdown bar chart */}
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

            {/* Supplier distribution pie chart */}
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

          {/* Full parsed BOM table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Imported BOM Detail
              </CardTitle>
              <CardDescription>
                All {parsedBom.totalLines} parsed line items from{" "}
                {parsedBom.fileName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={bomPreviewColumns}
                data={parsedBom.items}
                searchKey="shorttext"
                searchPlaceholder="Search components..."
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
