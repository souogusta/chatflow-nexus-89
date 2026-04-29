import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useCRM } from "@/store/crm-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STAGE_COLORS = [
  { label: "Roxo", value: "bg-primary" },
  { label: "Azul", value: "bg-info" },
  { label: "Verde", value: "bg-success" },
  { label: "Amarelo", value: "bg-warning" },
  { label: "Vermelho", value: "bg-hot" },
  { label: "Cinza", value: "bg-muted-foreground" },
];

export function StageManagerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { stages, deals, addStage, updateStage, moveStage, removeStage } = useCRM();
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState(STAGE_COLORS[0].value);

  const handleAdd = () => {
    const title = newTitle.trim();
    if (!title) return;

    addStage(title, newColor);
    setNewTitle("");
    setNewColor(STAGE_COLORS[0].value);
    toast.success("Etapa adicionada");
  };

  const handleRemove = (id: string, title: string) => {
    if (id === "fechado" || id === "perdido") {
      toast.error("Esta etapa e usada para finalizar atendimentos e nao pode ser removida");
      return;
    }

    const count = deals.filter(deal => deal.stage === id).length;
    const message = count > 0
      ? `Remover "${title}"? Os ${count} leads desta etapa serao movidos para a primeira etapa do funil.`
      : `Remover "${title}"?`;

    if (!window.confirm(message)) return;
    removeStage(id);
    toast.success("Etapa removida");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Organizar etapas</DialogTitle>
          <DialogDescription>Edite nomes, ordem e cor das colunas do Kanban.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-2 rounded-lg border border-border/70 bg-secondary/40 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <div>
              <Label htmlFor="stage-title">Nova etapa</Label>
              <Input
                id="stage-title"
                value={newTitle}
                onChange={event => setNewTitle(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter") handleAdd();
                }}
                placeholder="Ex: Follow-up"
              />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex h-10 items-center gap-1">
                {STAGE_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    title={color.label}
                    aria-label={color.label}
                    onClick={() => setNewColor(color.value)}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 border-background ring-offset-background transition",
                      color.value,
                      newColor === color.value ? "ring-2 ring-ring" : "ring-1 ring-border",
                    )}
                  />
                ))}
              </div>
            </div>
            <Button type="button" className="gap-2" onClick={handleAdd}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>

          <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
            {stages.map((stage, index) => (
              <div key={stage.id} className="grid gap-2 rounded-lg border border-border/70 bg-card p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <div className={cn("h-3 w-3 rounded-full", stage.color)} />
                <div className="min-w-0">
                  <Input
                    value={stage.title}
                    onChange={event => updateStage(stage.id, { title: event.target.value })}
                    onBlur={() => toast.success("Etapa atualizada")}
                    className="h-9"
                  />
                  <div className="mt-2 flex flex-wrap gap-1">
                    {STAGE_COLORS.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        title={color.label}
                        aria-label={color.label}
                        onClick={() => {
                          updateStage(stage.id, { color: color.value });
                          toast.success("Cor da etapa atualizada");
                        }}
                        className={cn(
                          "h-6 w-6 rounded-full border-2 border-background ring-offset-background transition",
                          color.value,
                          stage.color === color.value ? "ring-2 ring-ring" : "ring-1 ring-border",
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-1">
                  <Button type="button" size="icon" variant="ghost" disabled={index === 0} onClick={() => moveStage(stage.id, "up")} title="Subir etapa">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" disabled={index === stages.length - 1} onClick={() => moveStage(stage.id, "down")} title="Descer etapa">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemove(stage.id, stage.title)} title="Remover etapa">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>Concluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
