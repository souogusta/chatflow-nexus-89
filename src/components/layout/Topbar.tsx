import { Search, Bell, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60">
      <div className="flex items-center gap-4 px-6 lg:px-8 h-16">
        <div className="hidden lg:block">
          <h1 className="font-display text-lg font-bold leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex-1 max-w-md ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar conversas, clientes, vendedoras..." className="pl-9 bg-secondary border-transparent focus-visible:bg-card" />
        </div>

        <Button variant="outline" size="icon" className="rounded-xl">
          <Filter className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" className="rounded-xl relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
        </Button>

        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-semibold leading-tight">Ana Paula</div>
            <div className="text-xs text-muted-foreground">Administradora</div>
          </div>
          <Avatar className="w-9 h-9 ring-2 ring-primary/20">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold text-sm">AP</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
