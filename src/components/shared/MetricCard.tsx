import { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricCard({
  icon, label, value, delta, deltaValue, deltaPositive = true, accent = "primary", onClick,
}: {
  icon: ReactNode; label: string; value: string; delta?: string;
  deltaValue?: string; onClick?: () => void;
  deltaPositive?: boolean; accent?: "primary" | "success" | "warning" | "info" | "destructive";
}) {
  const accentMap = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
    destructive: "bg-destructive-soft text-destructive",
  };
  const content = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", accentMap[accent])}>
          {icon}
        </div>
        {(delta || deltaValue) && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {delta && (
              <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5",
                deltaPositive ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive")}>
                {deltaPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}{delta}
              </span>
            )}
            {deltaValue && (
              <span className={cn("inline-flex items-center text-xs font-semibold rounded-full px-2 py-0.5",
                deltaPositive ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive")}>
                {deltaValue}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      <div className="font-display text-2xl font-bold tracking-tight">{value}</div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="card-elevated w-full cursor-pointer p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
      </button>
    );
  }

  return <div className="card-elevated w-full p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-soft">{content}</div>;
}
