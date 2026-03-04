import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getKbCategories } from "@/lib/mock-kb";

interface KbFormData {
  category: string;
  question: string;
  answer: string;
  keywords: string;
  sourceUrl: string;
}

interface Props {
  initial?: KbFormData;
  onSave: (data: KbFormData) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

export function KbEditor({ initial, onSave, onCancel, readOnly }: Props) {
  const categories = getKbCategories();
  const [form, setForm] = useState<KbFormData>(initial ?? { category: "", question: "", answer: "", keywords: "", sourceUrl: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof KbFormData, string>>>({});

  const validate = (): boolean => {
    const e: Partial<Record<keyof KbFormData, string>> = {};
    if (!form.category) e.category = "Required";
    if (!form.question.trim()) e.question = "Required";
    if (form.question.length > 500) e.question = "Max 500 chars";
    if (!form.answer.trim()) e.answer = "Required";
    if (form.answer.length > 5000) e.answer = "Max 5000 chars";
    if (!form.keywords.trim()) e.keywords = "At least one keyword";
    if (!form.sourceUrl.trim()) e.sourceUrl = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSave(form);
  };

  const field = (key: keyof KbFormData, label: string) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {errors[key] && <span className="text-xs text-destructive ml-2">{errors[key]}</span>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        {field("category", "Category")}
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} disabled={readOnly}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        {field("question", "Question")}
        <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="h-8 text-xs" readOnly={readOnly} maxLength={500} />
      </div>
      <div>
        {field("answer", "Answer")}
        <Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="text-xs min-h-[100px]" readOnly={readOnly} maxLength={5000} />
      </div>
      <div>
        {field("keywords", "Keywords (comma-separated)")}
        <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} className="h-8 text-xs" readOnly={readOnly} />
      </div>
      <div>
        {field("sourceUrl", "Source URL")}
        <Input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} className="h-8 text-xs" readOnly={readOnly} />
      </div>
      {!readOnly && (
        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={handleSubmit}>Save</Button>
          <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      )}
    </div>
  );
}
