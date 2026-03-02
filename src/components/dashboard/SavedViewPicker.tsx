import { Button } from "@/components/ui/button";
import { Bookmark, ChevronDown } from "lucide-react";

export function SavedViewPicker() {
  return (
    <Button variant="outline" size="sm" className="text-xs" disabled>
      <Bookmark className="h-3 w-3 mr-1.5" />
      Saved Views
      <ChevronDown className="h-3 w-3 ml-1" />
    </Button>
  );
}
