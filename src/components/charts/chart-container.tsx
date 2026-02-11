"use client";

import { useState, useEffect } from "react";
import { ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  height?: number;
}

export function ChartContainer({
  title,
  subtitle,
  children,
  className,
  height = 300,
}: ChartContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className={cn("gap-0 py-0", className)}>
      {(title || subtitle) && (
        <CardHeader className="pb-2 pt-5">
          {title && <CardTitle className="text-base">{title}</CardTitle>}
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="px-4 pb-5 pt-2">
        {mounted ? (
          <ResponsiveContainer width="100%" height={height}>
            {children as React.ReactElement}
          </ResponsiveContainer>
        ) : (
          <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height }}
          >
            Loading chart...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
