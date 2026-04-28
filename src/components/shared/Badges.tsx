import { cn } from "@/lib/utils";
import { Flame, Snowflake, Thermometer, X } from "lucide-react";
import { Temperature } from "@/lib/mock-data";

export function ClientTemperatureBadge({ temp, size = "sm" }: { temp: Temperature; size?: "sm" | "md" }) {
  const cfg = {
    quente: { label: "Quente", icon: Flame, cls: "bg-hot-soft text-hot" },
    morno: { label: "Morno", icon: Thermometer, cls: "bg-warm-soft text-warm" },
    frio: { label: "Frio", icon: Snowflake, cls: "bg-cold-soft text-cold" },
  }[temp];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full font-semibold", cfg.cls,
      size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1")}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

export function TagBadge({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft text-primary text-[10px] font-semibold px-2 py-0.5">
      {label}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-primary/70"><X className="w-2.5 h-2.5" /></button>
      )}
    </span>
  );
}
