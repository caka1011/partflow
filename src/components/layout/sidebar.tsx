"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Cpu,
  Search,
  Upload,
  ShieldAlert,
  Star,
  Clock,
  AlertTriangle,
  DollarSign,
  PackageCheck,
  ChevronDown,
  ChevronRight,
  Microchip,
  Zap,
  Activity,
  Radio,
  CircuitBoard,
  Gauge,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const quickActions = [
  { label: "New Search", icon: Search, href: "/" },
  { label: "Import BOM", icon: Upload, href: "/assemblies" },
  { label: "Risk Scan", icon: ShieldAlert, href: "/risk-manager" },
];

const savedViews = [
  { label: "Critical Parts", icon: AlertTriangle, count: 12 },
  { label: "EOL Watch", icon: Clock, count: 8 },
  { label: "Price Alerts", icon: DollarSign, count: 5 },
  { label: "Stock Monitor", icon: PackageCheck, count: 23 },
];

const categories = [
  { name: "Microcontrollers", count: 342, icon: Microchip },
  { name: "Power Management", count: 218, icon: Zap },
  { name: "Analog ICs", count: 156, icon: Activity },
  { name: "RF & Wireless", count: 89, icon: Radio },
  { name: "Logic ICs", count: 204, icon: CircuitBoard },
  { name: "Sensors", count: 127, icon: Gauge },
  { name: "Discrete", count: 95, icon: Hash },
];

const recentSearches = [
  "STM32F407VGT6",
  "TPS65217C",
  "AD7124-8",
  "LM3671MF-3.3",
  "MAX17048G+T10",
];

export function Sidebar() {
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [recentOpen, setRecentOpen] = useState(true);

  return (
    <aside className="flex w-[260px] shrink-0 flex-col bg-slate-900 text-slate-300">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600">
          <Cpu className="size-4.5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          PartFlow
        </span>
      </div>

      <Separator className="bg-slate-700/50" />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {/* Quick Actions */}
        <div className="mb-5">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Quick Actions
          </p>
          <div className="flex flex-col gap-1">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="ghost"
                size="sm"
                className="h-8 justify-start gap-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                asChild
              >
                <Link href={action.href}>
                  <action.icon className="size-4 text-slate-400" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <Separator className="mb-4 bg-slate-700/50" />

        {/* Saved Views */}
        <div className="mb-5">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Saved Views
          </p>
          <div className="flex flex-col gap-0.5">
            {savedViews.map((view) => (
              <button
                key={view.label}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-800 hover:text-white"
              >
                <view.icon className="size-4 text-slate-400" />
                <span className="flex-1 text-left">{view.label}</span>
                <span className="rounded-full bg-slate-700/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                  {view.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Separator className="mb-4 bg-slate-700/50" />

        {/* Categories */}
        <div className="mb-5">
          <button
            onClick={() => setCategoriesOpen(!categoriesOpen)}
            className="mb-2 flex w-full items-center gap-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-400"
          >
            {categoriesOpen ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            Categories
          </button>
          {categoriesOpen && (
            <div className="flex flex-col gap-0.5">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-800 hover:text-white"
                >
                  <cat.icon className="size-3.5 text-slate-500" />
                  <span className="flex-1 text-left">{cat.name}</span>
                  <span className="text-xs text-slate-500">{cat.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator className="mb-4 bg-slate-700/50" />

        {/* Recent Searches */}
        <div>
          <button
            onClick={() => setRecentOpen(!recentOpen)}
            className="mb-2 flex w-full items-center gap-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-400"
          >
            {recentOpen ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            Recent Searches
          </button>
          {recentOpen && (
            <div className="flex flex-col gap-0.5">
              {recentSearches.map((mpn) => (
                <button
                  key={mpn}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-800 hover:text-white",
                    "font-mono text-xs text-slate-400"
                  )}
                >
                  <Search className="size-3 text-slate-600" />
                  {mpn}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Separator className="bg-slate-700/50" />
      <div className="px-4 py-3">
        <p className="text-[10px] text-slate-600">PartFlow v0.1.0</p>
      </div>
    </aside>
  );
}
