import { useDroppable } from "@dnd-kit/core";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KanbanColumn({ id, title, count, color, children }: { id: string; title: string; count: number; color: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 mb-2">
        <div className={cn("w-2 h-2 rounded-full", color)} />
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">{count}</span>
      </div>
      <div ref={setNodeRef}
        className={cn("flex-1 rounded-2xl p-2 space-y-2 min-h-[200px] transition-colors",
          isOver ? "bg-primary-soft border-2 border-dashed border-primary" : "bg-secondary/40 border-2 border-dashed border-transparent")}>
        {children}
      </div>
    </div>
  );
}
