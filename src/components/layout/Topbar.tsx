import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, MessageCircle, AlertTriangle, CheckCircle2, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCRM } from "@/store/crm-store";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const navigate = useNavigate();
  const { deals, accountProfile, logout, canViewDeal } = useCRM();
  const [search, setSearch] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = deals
    .filter(canViewDeal)
    .filter(deal => deal.unread || deal.temperature === "quente")
    .slice(0, 6);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    if (query) navigate(`/conversas?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60">
      <div className="grid grid-cols-[1fr_minmax(280px,460px)_1fr] items-center gap-4 px-6 lg:px-8 h-16">
        <div className="hidden lg:block min-w-0">
          <h1 className="font-display text-lg font-bold leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>

        <form onSubmit={submitSearch} className="relative w-full">
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" title="Buscar">
            <Search className="w-4 h-4" />
          </button>
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar conversas, clientes, vendedoras..."
            className="pl-9 bg-secondary border-transparent focus-visible:bg-card"
          />
        </form>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" size="icon" className="rounded-xl relative" onClick={() => setNotificationsOpen(true)}>
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />}
          </Button>

          <div className="flex items-center gap-3 pl-3 border-l border-border">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold leading-tight">{accountProfile.name}</div>
              <div className="text-xs text-muted-foreground">{accountProfile.role}</div>
            </div>
            <Avatar className="w-9 h-9 ring-2 ring-primary/20">
              <AvatarImage src={accountProfile.photoUrl} alt={accountProfile.name} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold text-sm">{accountProfile.avatar}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={logout} title="Sair">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Notificações</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {notifications.map(deal => (
              <button
                key={deal.id}
                className="w-full text-left p-3 rounded-xl bg-secondary/70 hover:bg-secondary border border-border/40"
                onClick={() => {
                  setNotificationsOpen(false);
                  navigate(`/conversas?deal=${deal.id}`);
                }}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {deal.unread ? <MessageCircle className="w-4 h-4 text-primary" /> : <AlertTriangle className="w-4 h-4 text-destructive" />}
                  {deal.customer}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1">{deal.lastMessage}</p>
              </button>
            ))}
            {notifications.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success" />
                Nenhuma notificação pendente.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
