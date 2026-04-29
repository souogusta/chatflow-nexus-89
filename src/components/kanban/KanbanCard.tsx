import { useDraggable } from "@dnd-kit/core";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Deal, SELLERS } from "@/lib/mock-data";
import { CalendarClock, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/store/crm-store";
import { cn } from "@/lib/utils";

const formatAppointment = (appointment: Appointment) => {
  const [year, month, day] = appointment.date.split("-");
  return `${day}/${month}/${year} às ${appointment.startTime}`;
};

const temperatureLabel = {
  quente: "Quente",
  morno: "Morno",
  frio: "Frio",
};

export function KanbanCard({ deal, nextAppointment, onClick }: { deal: Deal; nextAppointment?: Appointment; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const seller = SELLERS.find(s => s.id === deal.sellerId);

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}
      onClick={onClick}
      className={cn(
        "group rounded-xl border border-border/70 bg-card p-3 shadow-sm hover:border-primary/25 hover:shadow-soft cursor-pointer transition-all",
        isDragging ? "opacity-50 rotate-2" : "",
      )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm truncate">{deal.customer}</div>
          {deal.stage === "fechado" && deal.estimatedValue ? (
            <div className="text-xs font-bold text-success mt-0.5">R$ {deal.estimatedValue.toLocaleString("pt-BR")}</div>
          ) : null}
        </div>
        {deal.unread && <span className="shrink-0 rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Pendente</span>}
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{deal.lastMessage}</p>

      {deal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {deal.tags.slice(0, 2).map(t => (
            <span key={t} className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {t}
            </span>
          ))}
          {deal.tags.length > 2 && <span className="text-[10px] text-muted-foreground">+{deal.tags.length - 2}</span>}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar className="w-5 h-5"><AvatarFallback className="bg-secondary text-muted-foreground text-[9px] font-semibold">{seller?.avatar}</AvatarFallback></Avatar>
          <span className="text-[10px] text-muted-foreground truncate">{seller?.name.split(" ")[0]}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">Status: {temperatureLabel[deal.temperature]}</span>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5">
        <Clock className="w-2.5 h-2.5" />
        {formatDistanceToNow(new Date(deal.lastInteraction), { locale: ptBR, addSuffix: true })}
      </div>
      {nextAppointment && (
        <div className="mt-1.5 flex items-center gap-1 rounded-md bg-secondary/70 px-2 py-1 text-[10px] font-medium text-foreground">
          <CalendarClock className="h-3 w-3 text-muted-foreground" />
          <span className="truncate">Próximo contato: {formatAppointment(nextAppointment)}</span>
        </div>
      )}
    </div>
  );
}
