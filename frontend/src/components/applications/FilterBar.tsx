import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ApplicationFilters, ApplicationStatus } from "@/types/application";
import { ALL_STATUSES, STATUS_LABELS } from "@/types/application";

interface FilterBarProps {
  filters: ApplicationFilters;
  onChange: (f: ApplicationFilters) => void;
  total: number;
}

export function FilterBar({ filters, onChange, total }: FilterBarProps) {
  const setStatus = (status: ApplicationStatus | "") => onChange({ ...filters, status });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-gray-500 font-medium">{total} application{total !== 1 ? "s" : ""}</span>

      <div className="flex flex-wrap gap-1.5">
        <Button
          variant={!filters.status ? "default" : "outline"}
          size="sm"
          onClick={() => setStatus("")}
        >
          All
        </Button>
        {ALL_STATUSES.map((s) => (
          <Button
            key={s}
            variant={filters.status === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatus(s)}
          >
            {STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-gray-400">Sort by</span>
        <Select
          value={filters.sort ?? "created_at"}
          onValueChange={(v) => onChange({ ...filters, sort: v })}
        >
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Date added</SelectItem>
            <SelectItem value="date_applied">Date applied</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.order ?? "desc"}
          onValueChange={(v) => onChange({ ...filters, order: v as "asc" | "desc" })}
        >
          <SelectTrigger className="h-8 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest</SelectItem>
            <SelectItem value="asc">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
