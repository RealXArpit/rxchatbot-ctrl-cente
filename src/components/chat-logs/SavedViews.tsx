import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bookmark, Plus, Trash2 } from "lucide-react";

interface SavedView {
  id: string;
  name: string;
}

const STORAGE_KEY = "realx_chatlog_saved_views";

function loadViews(): SavedView[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [{ id: "default", name: "All Conversations" }];
}

function persistViews(views: SavedView[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
}

interface SavedViewsProps {
  onSelect?: (id: string) => void;
}

export function SavedViews({ onSelect }: SavedViewsProps) {
  const [views, setViews] = useState<SavedView[]>(loadViews);
  const [newName, setNewName] = useState("");
  const [selected, setSelected] = useState("default");

  const addView = () => {
    if (!newName.trim()) return;
    const view: SavedView = { id: `sv_${Date.now()}`, name: newName.trim() };
    const next = [...views, view];
    setViews(next);
    persistViews(next);
    setNewName("");
    setSelected(view.id);
    onSelect?.(view.id);
  };

  const removeView = (id: string) => {
    if (id === "default") return;
    const next = views.filter((v) => v.id !== id);
    setViews(next);
    persistViews(next);
    if (selected === id) {
      setSelected("default");
      onSelect?.("default");
    }
  };

  const selectView = (id: string) => {
    setSelected(id);
    onSelect?.(id);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
          <Bookmark className="h-3 w-3" />
          {views.find((v) => v.id === selected)?.name ?? "Views"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1 mb-2">
          {views.map((v) => (
            <div
              key={v.id}
              className={`flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                selected === v.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
              }`}
              onClick={() => selectView(v.id)}
            >
              <span className="truncate">{v.name}</span>
              {v.id !== "default" && (
                <button
                  className="text-muted-foreground hover:text-destructive shrink-0 ml-1"
                  onClick={(e) => { e.stopPropagation(); removeView(v.id); }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 border-t border-border pt-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New view name…"
            className="h-7 text-xs flex-1"
            onKeyDown={(e) => e.key === "Enter" && addView()}
          />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={addView}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
