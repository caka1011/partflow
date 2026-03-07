import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Package,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

const kpis = [
  {
    title: "Total Projects",
    value: "4",
    icon: Package,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Parts Tracked",
    value: "312",
    icon: BarChart3,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "At-Risk Parts",
    value: "18",
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Cost Trend",
    value: "+2.4%",
    icon: TrendingUp,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

export default function ExecutiveSummaryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Executive Summary
        </h1>
        <p className="text-muted-foreground mt-1">
          Coming soon — consolidated overview of your supply chain
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className="gap-0 py-0">
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`flex size-11 items-center justify-center rounded-lg ${kpi.bg}`}
                >
                  <Icon className={`size-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="gap-0 py-0">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart3 className="size-12 text-muted-foreground/40 mb-4" />
          <h2 className="text-lg font-semibold">Dashboard Under Development</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            This page will provide a consolidated executive view of supply chain
            health, cost trends, risk exposure, and compliance status across all
            projects.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
