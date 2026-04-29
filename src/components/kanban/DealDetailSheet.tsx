import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Deal, Temperature } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useCRM } from "@/store/crm-store";
import { ClientTemperatureBadge, TagBadge } from "@/components/shared/Badges";
import { CheckCircle2, MessageCircle, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";

export function DealDetailSheet({ deal, open, onOpenChange, onFinish }: {
  deal: Deal | null; open: boolean; onOpenChange: (v: boolean) => void; onFinish: () => void;
}) {
  const { updateDeal, tags, setTags, teamUsers } = useCRM();
  const [newTag, setNewTag] = useState("");
  const navigate = useNavigate();

  if (!deal) return null;

  const createAndAttachTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    setTags(prev => Array.from(new Set([...prev, tag])));
    updateDeal(deal.id, { tags: Array.from(new Set([...deal.tags, tag])) });
    setNewTag("");
    toast.success("Tag vinculada ao lead");
  };

  const toggleTag = (tag: string) => {
    const alreadyLinked = deal.tags.includes(tag);
    updateDeal(deal.id, {
      tags: alreadyLinked ? deal.tags.filter(item => item !== tag) : [...deal.tags, tag],
    });
  };

  const removeTag = (tag: string) => updateDeal(deal.id, { tags: deal.tags.filter(item => item !== tag) });
  const deleteGlobalTag = (tag: string) => {
    setTags(prev => prev.filter(item => item !== tag));
    updateDeal(deal.id, { tags: deal.tags.filter(item => item !== tag) });
    toast.success("Tag excluída");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-display flex items-center gap-2">
                <UserRound className="w-5 h-5 text-primary" /> Detalhes do lead
              </DialogTitle>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-2 border-success/30 text-success hover:text-success"
              title="Abrir conversa no WhatsApp"
              onClick={() => {
                onOpenChange(false);
                navigate(`/conversas?deal=${deal.id}`);
              }}
            >
              <MessageCircle className="w-4 h-4" />
              Abrir conversa
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="customer">Nome do lead</Label>
              <Input
                id="customer"
                value={deal.customer}
                onChange={event => updateDeal(deal.id, { customer: event.target.value })}
                onBlur={() => toast.success("Nome do lead atualizado")}
              />
            </div>
            <div>
              <Label htmlFor="phone">WhatsApp</Label>
              <Input id="phone" value={deal.phone} onChange={event => updateDeal(deal.id, { phone: event.target.value })} />
            </div>
          </div>

          <div>
            <Label htmlFor="interest">Interesse do Cliente</Label>
            <Input
              id="interest"
              value={deal.interest || ""}
              onChange={event => updateDeal(deal.id, { interest: event.target.value })}
              onBlur={() => toast.success("Interesse do cliente atualizado")}
              placeholder="Ex: Botox"
            />
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
                  {teamUsers.filter(user => user.active).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Tags vinculadas</Label>
            <div className="flex flex-wrap gap-1.5 my-2 min-h-[24px]">
              {deal.tags.map(tag => <TagBadge key={tag} label={tag} onRemove={() => removeTag(tag)} />)}
              {deal.tags.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma tag vinculada</span>}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Criar nova tag..." value={newTag} onChange={event => setNewTag(event.target.value)} onKeyDown={event => event.key === "Enter" && createAndAttachTag()} />
              <Button size="icon" variant="outline" onClick={createAndAttachTag}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <span key={tag} className={`inline-flex items-center rounded-full border transition-colors overflow-hidden ${
                  deal.tags.includes(tag)
                    ? "bg-primary-soft text-primary border-primary/30"
                    : "bg-secondary text-muted-foreground border-border"
                }`}>
                  <button
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="text-[11px] px-2 py-1 hover:text-foreground"
                  >
                    {tag}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteGlobalTag(tag)}
                    className="h-full px-1.5 py-1 border-l border-current/15 hover:bg-destructive/10 hover:text-destructive"
                    title={`Excluir tag ${tag}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observação interna</Label>
            <Textarea id="notes" defaultValue={deal.notes} onBlur={event => updateDeal(deal.id, { notes: event.target.value })} rows={3} />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <ClientTemperatureBadge temp={deal.temperature} size="md" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button className="bg-gradient-primary text-primary-foreground gap-2" onClick={onFinish}>
            <CheckCircle2 className="w-4 h-4" /> Concluir atendimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
