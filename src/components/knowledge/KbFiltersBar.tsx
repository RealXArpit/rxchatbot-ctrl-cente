import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { KbStatus } from "@/lib/mock-kb";
import { getKbCategories } from "@/lib/mock-kb";

export interface KbFilterState {
  q: string;
  status: KbStatus | "";
  category: string;
}

interface Props {
  filters: KbFilterState;
  onChange: (f: KbFilterState) => void;
}

export function KbFiltersBar({ filters, onChange }: Props) {
  const categories = getKbCategories();
  const hasFilters = filters.q || filters.status || filters.category;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search questions, answers, keywords..."
        value={filters.q}
        onChange={(e) => onChange({ ...filters, q: e.target.value })}
        className="w-64 h-8 text-xs"
      />
      <Select value={filters.status} onValueChange={(v) => onChange({ ...filters, status: v as KbStatus | "" })}>
        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all-statuses">All Statuses</SelectItem>
          {(["Draft", "Proposed", "Approved", "Published", "Archived"] as KbStatus[]).map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.category} onValueChange={(v) => onChange({ ...filters, category: v === "all-categories" ? "" : v })}>
        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all-categories">All Categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => onChange({ q: "", status: "", category: "" })}>
          <X className="h-3 w-3" /> Clear
        </Button>
      )}
    </div>
  );
}
