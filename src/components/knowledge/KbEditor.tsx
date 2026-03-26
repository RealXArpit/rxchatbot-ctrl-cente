import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getKbCategories } from "@/lib/mock-kb";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

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
  kbId?: string;
  isNew?: boolean;
}

export function KbEditor({ initial, onSave, onCancel, readOnly, kbId, isNew }: Props) {
  const categories = getKbCategories();
  const { client } = useTenant();
  const [form, setForm] = useState<KbFormData>(initial ?? { category: "", question: "", answer: "", keywords: "", sourceUrl: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof KbFormData, string>>>({});
  const [pushing, setPushing] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  const validate = (): boolean => {
    const e: Partial<Record<keyof KbFormData, string>> = {};
    if (!form.category) e.category = "Required";
    if (!form.question.trim()) e.question = "Required";
    if (form.question.length > 500) e.question = "Max 500 chars";
    if (!form.answer.trim()) e.answer = "Required";
    if (form.answer.length > 5000) e.answer = "Max 5000 chars";
    if (!form.keywords.trim()) e.keywords = "At least one keyword";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave(form);
    } else {
      toast.error("Please fill in all required fields before saving.");
      setTimeout(() => {
        const firstError = formRef.current?.querySelector('.text-destructive');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    }
  };

  const handleSaveAndPush = async () => {
    if (!validate() || !client) return;
    onSave(form);
    setPushing(true);
    try {
      await client.adminAction({
        operation: isNew ? "ADD_KB_ENTRY" : "UPDATE_KB_ENTRY",
        ...(kbId ? { kbId } : {}),
        category: form.category,
        question: form.question,
        answer: form.answer,
        keywords: form.keywords,
      });
      toast.success("Saved and pushed to n8n");
    } catch {
      toast.error("Saved locally but failed to push to n8n");
    } finally {
      setPushing(false);
    }
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
          <Button size="sm" onClick={handleSubmit}>Save Draft</Button>
          <Button size="sm" variant="outline" onClick={handleSaveAndPush} disabled={pushing} className="gap-1.5">
            {pushing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            Save + Push to n8n
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      )}
    </div>
  );
}
