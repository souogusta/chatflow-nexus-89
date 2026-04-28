import { useDraggable } from "@dnd-kit/core";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Deal, SELLERS } from "@/lib/mock-data";
import { ClientTemperatureBadge, TagBadge } from "@/components/shared/Badges";
import { Clock, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function KanbanCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const seller = SELLERS.find(s => s.id === deal.sellerId);

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}
      onClick={onClick}
      className={`group bg-card rounded-xl p-3 border border-border/60 shadow-sm hover:shadow-soft cursor-pointer transition-all ${isDragging ? "opacity-50 rotate-2" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm truncate">{deal.customer}</div>
          {deal.estimatedValue ? (
            <div className="text-xs font-bold text-success mt-0.5">R$ {deal.estimatedValue.toLocaleString("pt-BR")}</div>
          ) : null}
        </div>
        {deal.unread && <span className="w-2 h-2 rounded-full bg-destructive shrink-0 mt-1.5" />}
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{deal.lastMessage}</p>

      {deal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {deal.tags.slice(0, 2).map(t => <TagBadge key={t} label={t} />)}
          {deal.tags.length > 2 && <span className="text-[10px] text-muted-foreground">+{deal.tags.length - 2}</span>}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar className="w-5 h-5"><AvatarFallback className="bg-primary-soft text-primary text-[9px] font-semibold">{seller?.avatar}</AvatarFallback></Avatar>
          <span className="text-[10px] text-muted-foreground truncate">{seller?.name.split(" ")[0]}</span>
        </div>
        <ClientTemperatureBadge temp={deal.temperature} />
      </div>

      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5">
        <Clock className="w-2.5 h-2.5" />
        {formatDistanceToNow(new Date(deal.lastInteraction), { locale: ptBR, addSuffix: true })}
      </div>
    </div>
  );
}
