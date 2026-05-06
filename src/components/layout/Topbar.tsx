import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, MessageCircle, AlertTriangle, CheckCircle2, LogOut, Menu, KanbanSquare, CalendarClock, UserPlus, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCRM } from "@/store/crm-store";
import { StatusBadge } from "@/components/shared/Badges";

export function Topbar({ title, subtitle, onOpenMenu }: { title: string; subtitle?: string; onOpenMenu?: () => void }) {
  const navigate = useNavigate();
  const { deals, appointments, stages, teamUsers, accountProfile, logout, canViewDeal, updateDeal } = useCRM();
  const [search, setSearch] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);

  const visibleDeals = useMemo(() => deals.filter(canViewDeal), [canViewDeal, deals]);
  const notifications = useMemo(() => visibleDeals.flatMap(deal => [
    deal.unread && {
      id: `${deal.id}:unread`,
      deal,
      title: "Mensagem sem resposta",
      description: deal.lastMessage,
      status: "sem-resposta" as const,
      icon: MessageCircle,
      iconClassName: "text-primary",
    },
    deal.temperature === "quente" && {
      id: `${deal.id}:hot`,
      deal,
      title: "Lead quente",
      description: "Priorize este atendimento pelo nível de interesse.",
      status: "lead-parado" as const,
      icon: AlertTriangle,
      iconClassName: "text-destructive",
    },
    deal.tags.includes("Retornar hoje") && {
      id: `${deal.id}:return-today`,
      deal,
      title: "Retornar hoje",
      description: deal.lastMessage,
      status: "lead-parado" as const,
      icon: CalendarClock,
      iconClassName: "text-warning",
    },
  ].filter(Boolean))
    .filter(notification => !dismissedNotificationIds.includes(notification.id))
    .slice(0, 8), [dismissedNotificationIds, visibleDeals]);

  const resolveDealNotifications = (dealId: string) => {
    setDismissedNotificationIds(current => Array.from(new Set([
      ...current,
      `${dealId}:unread`,
      `${dealId}:hot`,
      `${dealId}:return-today`,
    ])));
    updateDeal(dealId, { unread: false });
  };

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query.length < 2) return [];

    const dealMatches = visibleDeals.flatMap(deal => {
      const seller = teamUsers.find(user => user.id === deal.sellerId)?.name || "";
      const stage = stages.find(item => item.id === deal.stage)?.title || deal.stage;
      const haystack = [deal.customer, deal.phone, deal.tags.join(" "), seller, stage, deal.temperature, deal.lastMessage].join(" ").toLowerCase();
      if (!haystack.includes(query)) return [];
      return [
        { id: `conversation-${deal.id}`, label: deal.customer, meta: `${deal.phone} - Conversa`, to: `/conversas?deal=${deal.id}` },
        { id: `kanban-${deal.id}`, label: deal.customer, meta: `${stage} - Card no Kanban`, to: `/kanban?deal=${deal.id}` },
      ];
    });

    const appointmentMatches = appointments.flatMap(appointment => {
      const deal = visibleDeals.find(item => item.id === appointment.dealId);
      if (!deal) return [];
      const seller = teamUsers.find(user => user.id === appointment.sellerId)?.name || "";
      const haystack = [deal.customer, deal.phone, seller, appointment.title, appointment.type].join(" ").toLowerCase();
      if (!haystack.includes(query)) return [];
      return [{ id: `appointment-${appointment.id}`, label: deal.customer, meta: `${appointment.startTime} - Agendamento`, to: `/calendario?deal=${deal.id}` }];
    });

    return [...dealMatches, ...appointmentMatches].slice(0, 8);
  }, [appointments, search, stages, teamUsers, visibleDeals]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    if (query) navigate(`/conversas?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60">
      <div className="grid grid-cols-[auto_1fr_auto] lg:grid-cols-[1fr_minmax(280px,460px)_1fr] items-center gap-3 px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="outline" size="icon" className="md:hidden rounded-xl" onClick={onOpenMenu} aria-label="Abrir menu">
            <Menu className="h-4 w-4" />
          </Button>
          <div className="hidden lg:block min-w-0">
          <h1 className="font-display text-lg font-bold leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        <form onSubmit={submitSearch} className="relative w-full min-w-0">
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" title="Buscar">
            <Search className="w-4 h-4" />
          </button>
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar conversas, clientes, vendedoras..."
            className="pl-9 bg-secondary border-transparent focus-visible:bg-card"
          />
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
              {searchResults.map(result => (
                <button
                  key={result.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-secondary"
                  onClick={() => {
                    setSearch("");
                    navigate(result.to);
                  }}
                >
                  <Search className="h-4 w-4 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{result.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{result.meta}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
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
            {notifications.map(notification => {
              const Icon = notification.icon;
              const { deal } = notification;
              return (
              <div
                key={notification.id}
                className="rounded-xl border border-border/40 bg-secondary/70 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Icon className={`h-4 w-4 ${notification.iconClassName}`} />
                      <span className="truncate">{deal.customer}</span>
                    </div>
                    <p className="mt-1 text-xs font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{notification.description}</p>
                  </div>
                  <StatusBadge status={notification.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => { setNotificationsOpen(false); navigate(`/conversas?deal=${deal.id}`); }}>
                    <MessageCircle className="h-3 w-3" /> Abrir
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => { setNotificationsOpen(false); navigate(`/kanban?deal=${deal.id}`); }}>
                    <KanbanSquare className="h-3 w-3" /> Kanban
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => { setNotificationsOpen(false); navigate(`/calendario?deal=${deal.id}`); }}>
                    <CalendarClock className="h-3 w-3" /> Retorno
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => resolveDealNotifications(deal.id)}>
                    <Check className="h-3 w-3" /> Resolvida
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => { setNotificationsOpen(false); navigate(`/usuarios`); }}>
                    <UserPlus className="h-3 w-3" /> Atribuir
                  </Button>
                </div>
              </div>
            )})}
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
