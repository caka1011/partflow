"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterConfig {
  key: string;
  label: string;
  options: string[];
  value?: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  onFilterChange: (key: string, value: string) => void;
  onClearAll: () => void;
}

export function FilterBar({
  filters,
  onFilterChange,
  onClearAll,
}: FilterBarProps) {
  const activeFilters = filters.filter((f) => f.value && f.value !== "all");

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Filter dropdowns */}
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={filter.value || "all"}
          onValueChange={(value) => onFilterChange(filter.key, value)}
        >
          <SelectTrigger size="sm" className="w-auto min-w-[140px]">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {filter.label}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {/* Active filter badges */}
      {activeFilters.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            {activeFilters.map((filter) => (
              <Badge
                key={filter.key}
                variant="secondary"
                className="gap-1 pl-2 pr-1"
              >
                <span className="text-xs text-muted-foreground">
                  {filter.label}:
                </span>
                <span className="text-xs">{filter.value}</span>
                <button
                  onClick={() => onFilterChange(filter.key, "all")}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>

          <Button
            variant="ghost"
            size="xs"
            onClick={onClearAll}
            className="text-muted-foreground"
          >
            Clear all
          </Button>
        </>
      )}
    </div>
  );
}
