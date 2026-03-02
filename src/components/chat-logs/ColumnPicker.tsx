import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Columns3 } from "lucide-react";
import { ALL_COLUMNS, type ColumnKey } from "@/lib/mock-conversations";

const STORAGE_KEY = "realx_chatlog_columns";

function loadColumns(): ColumnKey[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
}

function saveColumns(cols: ColumnKey[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cols));
}

interface ColumnPickerProps {
  value: ColumnKey[];
  onChange: (cols: ColumnKey[]) => void;
}

export function ColumnPicker({ value, onChange }: ColumnPickerProps) {
  const toggle = (key: ColumnKey) => {
    const next = value.includes(key) ? value.filter((k) => k !== key) : [...value, key];
    onChange(next);
    saveColumns(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
          <Columns3 className="h-3 w-3" /> Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          {ALL_COLUMNS.map((col) => (
            <label key={col.key} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer text-xs">
              <Checkbox
                checked={value.includes(col.key)}
                onCheckedChange={() => toggle(col.key)}
              />
              <span>{col.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { loadColumns };
