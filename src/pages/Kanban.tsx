import { useMemo, useRef, useState, WheelEvent } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useCRM } from "@/store/crm-store";
import { Deal, DealStage } from "@/lib/mock-data";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { KanbanCard } from "@/components/kanban/KanbanCard";
import { DealDetailSheet } from "@/components/kanban/DealDetailSheet";
import { FinishDealModal } from "@/components/kanban/FinishDealModal";
import { NewDealModal } from "@/components/kanban/NewDealModal";
import { StageManagerDialog } from "@/components/kanban/StageManagerDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Filter, Plus, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Kanban() {
  const { deals, moveDeal, stages, removeStage, appointments, canViewDeal, isAdmin, teamUsers, tags } = useCRM();
  const boardRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [selected, setSelected] = useState<Deal | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [stagesOpen, setStagesOpen] = useState(false);
  const [filterSeller, setFilterSeller] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [filterWaiting, setFilterWaiting] = useState("all");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const selectedDeal = selected ? deals.find(deal => deal.id === selected.id) || selected : null;
  const activeFilters = [filterSeller !== "all", filterTag !== "all", filterWaiting !== "all", Boolean(filterStart), Boolean(filterEnd)]
    .filter(Boolean).length;

  const visibleDeals = useMemo(() => {
    const start = filterStart ? new Date(`${filterStart}T00:00:00`).getTime() : null;
    const end = filterEnd ? new Date(`${filterEnd}T23:59:59`).getTime() : null;

    return deals.filter(deal => {
      const interaction = new Date(deal.lastInteraction).getTime();
      return canViewDeal(deal)
        && (!isAdmin || filterSeller === "all" || deal.sellerId === filterSeller)
        && (!isAdmin || filterTag === "all" || deal.tags.includes(filterTag))
        && (!isAdmin || filterWaiting === "all" || (filterWaiting === "cliente-aguardando" ? deal.unread : !deal.unread))
        && (!isAdmin || !start || interaction >= start)
        && (!isAdmin || !end || interaction <= end);
    });
  }, [canViewDeal, deals, filterEnd, filterSeller, filterStart, filterTag, filterWaiting, isAdmin]);

  const grouped = useMemo(() => {
    const map = new Map<DealStage, Deal[]>();
    stages.forEach(s => map.set(s.id, []));
    visibleDeals.forEach(d => map.get(d.stage)?.push(d));
    return map;
  }, [visibleDeals, stages]);

  const nextAppointmentByDeal = useMemo(() => {
    const now = new Date();
    const map = new Map<string, typeof appointments[number]>();
    appointments
      .filter(appointment => new Date(`${appointment.date}T${appointment.startTime}`) >= now)
      .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))
      .forEach(appointment => {
        if (!map.has(appointment.dealId)) map.set(appointment.dealId, appointment);
      });
    return map;
  }, [appointments]);

  const handleRemoveStage = (id: string, title: string, count: number) => {
    if (id === "fechado" || id === "perdido") {
      toast.error("Esta etapa é usada para finalizar atendimentos e não pode ser removida");
      return;
    }
    const message = count > 0
      ? `Remover "${title}"? Os ${count} leads desta etapa serão movidos para a primeira etapa do funil.`
      : `Remover "${title}"?`;
    if (!window.confirm(message)) return;
    removeStage(id);
    toast.success("Etapa removida");
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const dealId = e.active.id as string;
    if (!isAdmin) {
      toast.error("Somente administradores alteram o funil");
      return;
    }
    const newStage = e.over?.id as DealStage | undefined;
    if (!newStage) return;
    const deal = visibleDeals.find(d => d.id === dealId);
    if (!deal || deal.stage === newStage) return;
    if (newStage === "fechado" || newStage === "perdido") {
      setSelected(deal);
      setFinishOpen(true);
      return;
    }
    moveDeal(dealId, newStage);
    toast.success(`Movido para ${stages.find(s => s.id === newStage)?.title}`);
  };

  const handleBoardWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

    const columnScroll = (event.target as HTMLElement).closest<HTMLElement>("[data-kanban-column-scroll='true']");
    if (columnScroll) {
      return;
    }

    const board = boardRef.current;
    if (!board) return;

    event.preventDefault();
    board.scrollLeft += event.deltaY;
  };

  return (
    <AppLayout title="Kanban Comercial" subtitle="Arraste os cards entre as colunas">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">{visibleDeals.length} conversas no funil</div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="relative" title="Filtros">
                    <Filter className="h-4 w-4" />
                    {activeFilters > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {activeFilters}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[340px] p-4">
                  <div className="mb-3">
                    <div className="text-sm font-semibold">Filtros do funil</div>
                    <div className="text-xs text-muted-foreground">Refine a visualização dos leads.</div>
                  </div>
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Periodo inicial</Label>
                        <Input type="date" value={filterStart} onChange={event => setFilterStart(event.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Periodo final</Label>
                        <Input type="date" value={filterEnd} onChange={event => setFilterEnd(event.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Vendedora</Label>
                      <Select value={filterSeller} onValueChange={setFilterSeller}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {teamUsers.filter(user => user.active && user.role !== "Administrador").map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Tag</Label>
                      <Select value={filterTag} onValueChange={setFilterTag}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {tags.map(tag => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Retorno</Label>
                      <Select value={filterWaiting} onValueChange={setFilterWaiting}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="cliente-aguardando">Cliente aguardando</SelectItem>
                          <SelectItem value="aguardando-cliente">Aguardando cliente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => { setFilterStart(""); setFilterEnd(""); setFilterSeller("all"); setFilterTag("all"); setFilterWaiting("all"); }}>
                      Limpar filtros
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="outline" className="gap-2" onClick={() => setStagesOpen(true)}>
                <Settings2 className="w-4 h-4" /> Organizar etapas
              </Button>
            </>
          )}
          <Button className="bg-gradient-primary gap-2" onClick={() => setNewDealOpen(true)}>
            <Plus className="w-4 h-4" /> Criar atendimento
          </Button>
        </div>
      </div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          ref={boardRef}
          onWheel={handleBoardWheel}
          className="flex h-[calc(100vh-13.5rem)] min-h-[420px] gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-4 scrollbar-thin -mx-6 lg:-mx-8 px-6 lg:px-8"
        >
          {stages.map(s => (
            <KanbanColumn
              key={s.id}
              id={s.id}
              title={s.title}
              color={s.color}
              count={grouped.get(s.id)?.length || 0}
              totalValue={(grouped.get(s.id) || []).reduce((sum, deal) => sum + (deal.estimatedValue || 0), 0)}
              onRename={() => setStagesOpen(true)}
              onRemove={() => handleRemoveStage(s.id, s.title, grouped.get(s.id)?.length || 0)}
            >
              {grouped.get(s.id)?.map(d => (
                <KanbanCard key={d.id} deal={d} nextAppointment={nextAppointmentByDeal.get(d.id)} draggable={isAdmin} onClick={() => { setSelected(d); setSheetOpen(true); }} />
              ))}
            </KanbanColumn>
          ))}
        </div>
      </DndContext>

      <DealDetailSheet deal={selectedDeal} open={sheetOpen} onOpenChange={setSheetOpen}
        onFinish={() => { setSheetOpen(false); setFinishOpen(true); }} />
      <FinishDealModal deal={selectedDeal} open={finishOpen} onOpenChange={setFinishOpen} />
      <NewDealModal open={newDealOpen} onOpenChange={setNewDealOpen} />
      <StageManagerDialog open={stagesOpen} onOpenChange={setStagesOpen} />
    </AppLayout>
  );
}
