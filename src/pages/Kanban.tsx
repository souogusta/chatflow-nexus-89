import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useCRM } from "@/store/crm-store";
import { Deal, DealStage, STAGES } from "@/lib/mock-data";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { KanbanCard } from "@/components/kanban/KanbanCard";
import { DealDetailSheet } from "@/components/kanban/DealDetailSheet";
import { FinishDealModal } from "@/components/kanban/FinishDealModal";
import { NewDealModal } from "@/components/kanban/NewDealModal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Kanban() {
  const { deals, moveDeal } = useCRM();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [selected, setSelected] = useState<Deal | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [newDealOpen, setNewDealOpen] = useState(false);
  const selectedDeal = selected ? deals.find(deal => deal.id === selected.id) || selected : null;

  const grouped = useMemo(() => {
    const map = new Map<DealStage, Deal[]>();
    STAGES.forEach(s => map.set(s.id, []));
    deals.forEach(d => map.get(d.stage)?.push(d));
    return map;
  }, [deals]);

  const handleDragEnd = (e: DragEndEvent) => {
    const dealId = e.active.id as string;
    const newStage = e.over?.id as DealStage | undefined;
    if (!newStage) return;
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === newStage) return;
    if (newStage === "fechado" || newStage === "perdido") {
      setSelected(deal);
      setFinishOpen(true);
      return;
    }
    moveDeal(dealId, newStage);
    toast.success(`Movido para ${STAGES.find(s => s.id === newStage)?.title}`);
  };

  return (
    <AppLayout title="Kanban Comercial" subtitle="Arraste os cards entre as colunas">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">{deals.length} conversas no funil</div>
        <Button className="bg-gradient-primary gap-2" onClick={() => setNewDealOpen(true)}>
          <Plus className="w-4 h-4" /> Criar atendimento
        </Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin -mx-6 lg:-mx-8 px-6 lg:px-8">
          {STAGES.map(s => (
            <KanbanColumn key={s.id} id={s.id} title={s.title} color={s.color} count={grouped.get(s.id)?.length || 0}>
              {grouped.get(s.id)?.map(d => (
                <KanbanCard key={d.id} deal={d} onClick={() => { setSelected(d); setSheetOpen(true); }} />
              ))}
            </KanbanColumn>
          ))}
        </div>
      </DndContext>

      <DealDetailSheet deal={selectedDeal} open={sheetOpen} onOpenChange={setSheetOpen}
        onFinish={() => { setSheetOpen(false); setFinishOpen(true); }} />
      <FinishDealModal deal={selectedDeal} open={finishOpen} onOpenChange={setFinishOpen} />
      <NewDealModal open={newDealOpen} onOpenChange={setNewDealOpen} />
    </AppLayout>
  );
}
