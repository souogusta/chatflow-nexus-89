import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Deal, SELLERS, Temperature } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useCRM } from "@/store/crm-store";
import { ClientTemperatureBadge, TagBadge } from "@/components/shared/Badges";
import { useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function DealDetailSheet({ deal, open, onOpenChange, onFinish }: {
  deal: Deal | null; open: boolean; onOpenChange: (v: boolean) => void; onFinish: () => void;
}) {
  const { updateDeal } = useCRM();
  const [newTag, setNewTag] = useState("");

  if (!deal) return null;

  const addTag = () => {
    if (!newTag.trim()) return;
    updateDeal(deal.id, { tags: Array.from(new Set([...deal.tags, newTag.trim()])) });
    setNewTag("");
  };
  const removeTag = (t: string) => updateDeal(deal.id, { tags: deal.tags.filter(x => x !== t) });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">{deal.customer}</SheetTitle>
          <p className="text-xs text-muted-foreground">{deal.phone}</p>
        </SheetHeader>

        <div className="py-4 space-y-5">
          <div>
            <Label className="text-xs uppercase text-muted-foreground">Última mensagem</Label>
            <p className="text-sm bg-secondary rounded-xl p-3 mt-1">{deal.lastMessage}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Temperatura</Label>
              <Select value={deal.temperature} onValueChange={(v) => { updateDeal(deal.id, { temperature: v as Temperature }); toast.success("Temperatura atualizada"); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quente">Quente</SelectItem>
                  <SelectItem value="morno">Morno</SelectItem>
                  <SelectItem value="frio">Frio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável</Label>
              <Select value={deal.sellerId} onValueChange={(v) => { updateDeal(deal.id, { sellerId: v }); toast.success("Responsável alterado"); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SELLERS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 my-2 min-h-[24px]">
              {deal.tags.map(t => <TagBadge key={t} label={t} onRemove={() => removeTag(t)} />)}
              {deal.tags.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma tag</span>}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Nova tag..." value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()} />
              <Button size="icon" variant="outline" onClick={addTag}><Plus className="w-4 h-4" /></Button>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observação interna</Label>
            <Textarea id="notes" defaultValue={deal.notes} onBlur={e => updateDeal(deal.id, { notes: e.target.value })} rows={3} />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <ClientTemperatureBadge temp={deal.temperature} size="md" />
          </div>

          <Button className="w-full bg-gradient-primary text-primary-foreground gap-2" onClick={onFinish}>
            <CheckCircle2 className="w-4 h-4" /> Concluir atendimento
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
