import { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-8 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
        {icon || <Inbox className="h-5 w-5" />}
      </div>
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button type="button" className="mt-4 bg-gradient-primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
