import { useDraggable } from "@dnd-kit/core";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Deal } from "@/lib/mock-data";
import { ClientTemperatureBadge, TagBadge } from "@/components/shared/Badges";
import { CalendarClock, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/store/crm-store";
import { cn } from "@/lib/utils";
import { useCRM } from "@/store/crm-store";

const formatAppointment = (appointment: Appointment) => {
  const [year, month, day] = appointment.date.split("-");
  return `${day}/${month}/${year} às ${appointment.startTime}`;
};

export function KanbanCard({ deal, nextAppointment, onClick, draggable = true }: { deal: Deal; nextAppointment?: Appointment; onClick: () => void; draggable?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id, disabled: !draggable });
  const { teamUsers } = useCRM();
  const seller = teamUsers.find(s => s.id === deal.sellerId);

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...(draggable ? listeners : {})} {...(draggable ? attributes : {})}
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
        {deal.unread && (
          <span
            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-destructive"
            title="Cliente aguardando"
            aria-label="Cliente aguardando"
          />
        )}
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{deal.interest || "Interesse nao informado"}</p>

      {deal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {deal.tags.slice(0, 2).map(t => <TagBadge key={t} label={t} />)}
          {deal.tags.length > 2 && <span className="text-[10px] text-muted-foreground">+{deal.tags.length - 2}</span>}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar className="w-5 h-5">
            <AvatarImage src={seller?.photoUrl} alt={seller?.name} />
            <AvatarFallback className="bg-primary-soft text-primary text-[9px] font-semibold">{seller?.avatar}</AvatarFallback>
          </Avatar>
          <span className="text-[10px] text-muted-foreground truncate">{seller?.name.split(" ")[0]}</span>
        </div>
        <ClientTemperatureBadge temp={deal.temperature} />
      </div>

      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5">
        <Clock className="w-2.5 h-2.5" />
        {formatDistanceToNow(new Date(deal.lastInteraction), { locale: ptBR, addSuffix: true })}
      </div>
      {nextAppointment && (
        <div className="mt-1.5 flex items-center gap-1 rounded-md bg-secondary/70 px-2 py-1 text-[10px] font-medium text-foreground">
          <CalendarClock className="h-3 w-3 text-primary" />
          <span className="truncate">Próximo contato: {formatAppointment(nextAppointment)}</span>
        </div>
      )}
    </div>
  );
}
