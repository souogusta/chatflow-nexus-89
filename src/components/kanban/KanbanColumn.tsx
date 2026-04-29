import { useDroppable } from "@dnd-kit/core";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

const formatBRL = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function KanbanColumn({ id, title, count, totalValue, onRename, onRemove, children }: {
  id: string;
  title: string;
  count: number;
  totalValue: number;
  onRename: () => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      <div className="mb-3 rounded-xl border border-border/70 bg-card px-3 py-3 shadow-sm">
        <div className="grid grid-cols-[1fr_52px] items-center gap-2">
          <h3 className="min-w-0 text-center text-sm font-semibold leading-tight truncate">{title}</h3>
          <div className="flex justify-end gap-1">
            <Button type="button" size="icon" variant="ghost" className="h-6 w-6" title="Editar etapa" onClick={onRename}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" title="Remover etapa" onClick={onRemove}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {id === "fechado" && (
          <div className="mt-1 text-center text-[11px] font-medium text-muted-foreground">
            Total: {formatBRL(totalValue)}
          </div>
        )}
        <div className="mt-1 text-center text-[11px] text-muted-foreground">
          {count} {count === 1 ? "negócio" : "negócios"}
        </div>
      </div>
      <div ref={setNodeRef}
        className={cn("flex-1 rounded-2xl p-2 space-y-2 min-h-[200px] transition-colors",
          isOver ? "bg-secondary border-2 border-dashed border-muted-foreground/30" : "bg-secondary/40 border-2 border-dashed border-transparent")}>
        {children}
      </div>
    </div>
  );
}
