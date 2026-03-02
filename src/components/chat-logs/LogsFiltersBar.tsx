import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Search, CalendarIcon, X } from "lucide-react";
import type { ConversationFilters } from "@/lib/mock-conversations";

interface LogsFiltersBarProps {
  filters: ConversationFilters;
  onChange: (filters: ConversationFilters) => void;
}

export function LogsFiltersBar({ filters, onChange }: LogsFiltersBarProps) {
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const update = (patch: Partial<ConversationFilters>) => onChange({ ...filters, ...patch });

  const hasFilters =
    filters.q || filters.channel || filters.routedTo || filters.confidenceBand ||
    filters.cacheHit !== undefined && filters.cacheHit !== null ||
    filters.dateFrom || filters.dateTo;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search ID, session, user…"
          className="pl-8 h-8 w-52 text-xs"
          value={filters.q ?? ""}
          onChange={(e) => update({ q: e.target.value || undefined })}
        />
      </div>

      {/* Channel */}
      <Select
        value={filters.channel ?? "__all__"}
        onValueChange={(v) => update({ channel: v === "__all__" ? undefined : v })}
      >
        <SelectTrigger className="h-8 w-28 text-xs">
          <SelectValue placeholder="Channel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Channels</SelectItem>
          <SelectItem value="WEBSITE">Website</SelectItem>
          <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
          <SelectItem value="API">API</SelectItem>
        </SelectContent>
      </Select>

      {/* Routed To */}
      <Select
        value={filters.routedTo ?? "__all__"}
        onValueChange={(v) => update({ routedTo: v === "__all__" ? undefined : v })}
      >
        <SelectTrigger className="h-8 w-28 text-xs">
          <SelectValue placeholder="Routed To" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Routes</SelectItem>
          <SelectItem value="BOT">Bot</SelectItem>
          <SelectItem value="HUMAN">Human</SelectItem>
        </SelectContent>
      </Select>

      {/* Confidence Band */}
      <Select
        value={filters.confidenceBand ?? "__all__"}
        onValueChange={(v) => update({ confidenceBand: v === "__all__" ? undefined : v as "high" | "medium" | "low" })}
      >
        <SelectTrigger className="h-8 w-32 text-xs">
          <SelectValue placeholder="Confidence" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Confidence</SelectItem>
          <SelectItem value="high">High (≥0.72)</SelectItem>
          <SelectItem value="medium">Medium (0.55–0.72)</SelectItem>
          <SelectItem value="low">Low (&lt;0.55)</SelectItem>
        </SelectContent>
      </Select>

      {/* Cache Hit */}
      <Select
        value={filters.cacheHit === true ? "true" : filters.cacheHit === false ? "false" : "__all__"}
        onValueChange={(v) => update({ cacheHit: v === "__all__" ? null : v === "true" })}
      >
        <SelectTrigger className="h-8 w-28 text-xs">
          <SelectValue placeholder="Cache" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Cache</SelectItem>
          <SelectItem value="true">Cache Hit</SelectItem>
          <SelectItem value="false">Cache Miss</SelectItem>
        </SelectContent>
      </Select>

      {/* Date From */}
      <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5", !filters.dateFrom && "text-muted-foreground")}>
            <CalendarIcon className="h-3 w-3" />
            {filters.dateFrom ? format(new Date(filters.dateFrom), "d MMM") : "From"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
            onSelect={(d) => { update({ dateFrom: d?.toISOString().slice(0, 10) }); setDateFromOpen(false); }}
            className={cn("p-3 pointer-events-auto")}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Date To */}
      <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5", !filters.dateTo && "text-muted-foreground")}>
            <CalendarIcon className="h-3 w-3" />
            {filters.dateTo ? format(new Date(filters.dateTo), "d MMM") : "To"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
            onSelect={(d) => { update({ dateTo: d?.toISOString().slice(0, 10) }); setDateToOpen(false); }}
            className={cn("p-3 pointer-events-auto")}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Clear */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground"
          onClick={() => onChange({})}
        >
          <X className="h-3 w-3 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}
