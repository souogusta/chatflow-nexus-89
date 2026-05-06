import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCRM } from "@/store/crm-store";
import { Deal } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ClientTemperatureBadge, ConversationStatus, StatusBadge, TagBadge } from "@/components/shared/Badges";
import { EmptyState } from "@/components/shared/EmptyState";
import { Bot, CalendarClock, Check, Info, KanbanSquare, Lock, MoreVertical, Pencil, Plus, Search, Tag, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type Conversation = {
  id: string;
  dealId?: string;
  customer: string;
  phone: string;
  lastMessage: string;
  lastInteraction: string;
  sellerId: string;
  assignedSellerIds?: string[];
  temperature: Deal["temperature"];
  tags: string[];
  unread: boolean;
  stage?: string;
  notes?: string;
  aiEnabled?: boolean;
  aiAgentId?: string;
};

const initialInboxConversations: Conversation[] = [
  {
    id: "inbox-1",
    customer: "Novo Lead WhatsApp",
    phone: "+55 11 94444-0101",
    lastMessage: "Quero saber valores e disponibilidade",
    lastInteraction: "2026-05-05T10:12:00.000Z",
    sellerId: "s1",
    assignedSellerIds: ["s1"],
    temperature: "morno",
    tags: ["WhatsApp"],
    unread: true,
    notes: "Conversa ainda sem card no Kanban.",
  },
  {
    id: "inbox-2",
    customer: "Indicação Comercial",
    phone: "+55 21 95555-0202",
    lastMessage: "Fui indicado por um cliente antigo",
    lastInteraction: "2026-05-05T09:45:00.000Z",
    sellerId: "s2",
    assignedSellerIds: ["s2"],
    temperature: "quente",
    tags: ["Cliente antigo"],
    unread: true,
    notes: "Lead novo aguardando qualificação.",
  },
];

const toConversation = (deal: Deal): Conversation => ({
  id: `deal-${deal.id}`,
  dealId: deal.id,
  customer: deal.customer,
  phone: deal.phone,
  lastMessage: deal.lastMessage,
  lastInteraction: deal.lastInteraction,
  sellerId: deal.sellerId,
  assignedSellerIds: deal.assignedSellerIds || [],
  temperature: deal.temperature,
  tags: deal.tags,
  unread: deal.unread,
  stage: deal.stage,
  notes: deal.notes,
  aiEnabled: deal.aiEnabled,
  aiAgentId: deal.aiAgentId,
});

const conversationStatus = (conversation: Conversation): ConversationStatus => {
  if (!conversation.dealId) return "nova";
  if (conversation.stage === "fechado" || conversation.stage === "perdido") return "finalizada";
  if (conversation.unread) return "sem-resposta";
  if (conversation.stage === "aguardando-resposta") return "aguardando-cliente";
  if (Date.now() - new Date(conversation.lastInteraction).getTime() > 24 * 3600000) return "lead-parado";
  return "em-atendimento";
};

const statusFilters = [
  { id: "sem-resposta", label: "Sem resposta" },
  { id: "minhas", label: "Minhas conversas" },
  { id: "aguardando-cliente", label: "Aguardando cliente" },
  { id: "finalizadas", label: "Finalizadas" },
  { id: "todas", label: "Todas" },
];

export default function Conversas() {
  const { deals, updateDeal, canViewDeal, currentUser, isAdmin, teamUsers, tags, setTags, stages, agents, hasPermission } = useCRM();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDealId = searchParams.get("deal");
  const query = searchParams.get("q")?.toLowerCase().trim() || "";
  const statusQuery = searchParams.get("status") || "todas";
  const [conversationSearch, setConversationSearch] = useState(query);
  const [statusFilter, setStatusFilter] = useState(statusQuery);
  const [inboxConversations, setInboxConversations] = useState<Conversation[]>(initialInboxConversations);
  const [newTag, setNewTag] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [leadActionsOpen, setLeadActionsOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");

  const sellerOptions = useMemo(() => teamUsers.filter(user => user.active && user.role !== "Administrador"), [teamUsers]);
  const activeAgents = useMemo(() => agents.filter(agent => agent.active), [agents]);
  const accessibleDealConversations = deals.filter(canViewDeal).map(toConversation);
  const accessibleInboxConversations = inboxConversations.filter(conversation =>
    isAdmin ||
    conversation.sellerId === currentUser?.id ||
    conversation.assignedSellerIds?.includes(currentUser?.id || "") ||
    conversation.tags.some(tag => currentUser?.allowedTags?.includes(tag))
  );
  const conversations = [...accessibleInboxConversations, ...accessibleDealConversations].sort((a, b) =>
    new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime()
  );
  const initialSelectedId = initialDealId && accessibleDealConversations.some(d => d.dealId === initialDealId)
    ? `deal-${initialDealId}`
    : conversations[0]?.id;
  const [selectedId, setSelectedId] = useState(initialSelectedId);

  const activeSearch = conversationSearch.toLowerCase().trim();
  const visibleConversations = (activeSearch
    ? conversations.filter(conversation =>
      conversation.customer.toLowerCase().includes(activeSearch) ||
      conversation.phone.toLowerCase().includes(activeSearch) ||
      conversation.lastMessage.toLowerCase().includes(activeSearch) ||
      conversation.tags.some(tag => tag.toLowerCase().includes(activeSearch)) ||
      sellerOptions.some(user => [user.name, user.role].join(" ").toLowerCase().includes(activeSearch) && [conversation.sellerId, ...(conversation.assignedSellerIds || [])].includes(user.id))
    )
    : conversations).filter(conversation => {
      const status = conversationStatus(conversation);
      if (statusFilter === "todas") return true;
      if (statusFilter === "minhas") return [conversation.sellerId, ...(conversation.assignedSellerIds || [])].includes(currentUser?.id || "");
      if (statusFilter === "finalizadas") return status === "finalizada";
      return status === statusFilter;
    });
  const selected = conversations.find(conversation => conversation.id === selectedId) || visibleConversations[0];
  const selectedDeal = selected?.dealId ? deals.find(deal => deal.id === selected.dealId) : null;
  const assignedIds = Array.from(new Set([selected?.sellerId, ...(selected?.assignedSellerIds || [])].filter(Boolean)));
  const assignedUsers = sellerOptions.filter(user => assignedIds.includes(user.id));
  const canEditLeadName = isAdmin || hasPermission("Editar atendimentos");
  const selectedStatus = selected ? conversationStatus(selected) : null;

  useEffect(() => {
    setEditingName(false);
    setNameDraft(selected?.customer || "");
    setNotesDraft(selected?.notes || "");
  }, [selected?.id, selected?.customer, selected?.notes]);

  const updateSelectedConversation = (patch: Partial<Conversation>) => {
    if (!selected) return;
    if (selected.dealId) {
      updateDeal(selected.dealId, patch as Partial<Deal>);
      return;
    }
    setInboxConversations(current => current.map(conversation =>
      conversation.id === selected.id ? { ...conversation, ...patch } : conversation
    ));
  };

  const toggleTag = (tag: string) => {
    if (!selected) return;
    const nextTags = selected.tags.includes(tag)
      ? selected.tags.filter(item => item !== tag)
      : [...selected.tags, tag];
    updateSelectedConversation({ tags: nextTags });
  };

  const addTagToConversation = () => {
    const tag = newTag.trim();
    if (!selected || !tag) return;
    if (!tags.includes(tag)) setTags(current => [...current, tag]);
    if (!selected.tags.includes(tag)) updateSelectedConversation({ tags: [...selected.tags, tag] });
    setNewTag("");
    toast.success("Tag aplicada");
  };

  const saveLeadName = () => {
    if (!selected || !canEditLeadName) return;
    const customer = nameDraft.trim();
    if (!customer) {
      toast.error("Informe o nome do lead");
      return;
    }
    updateSelectedConversation({ customer });
    setEditingName(false);
    toast.success("Nome do lead atualizado");
  };

  const changeTemperature = (temperature: Deal["temperature"]) => {
    if (!selected) return;
    updateSelectedConversation({ temperature });
    toast.success("Temperatura do lead atualizada");
  };

  const changeStage = (stage: string) => {
    if (!selected) return;
    updateSelectedConversation({ stage });
    toast.success("Etapa do funil atualizada");
  };

  const toggleAI = (enabled: boolean) => {
    if (!selected) return;
    updateSelectedConversation({
      aiEnabled: enabled,
      aiAgentId: enabled ? selected.aiAgentId || activeAgents[0]?.id || agents[0]?.id : selected.aiAgentId,
    });
    toast.success(enabled ? "Agente de IA ligado" : "Agente de IA desligado");
  };

  const changeAIAgent = (agentId: string) => {
    if (!selected) return;
    updateSelectedConversation({ aiAgentId: agentId, aiEnabled: true });
    toast.success("Agente de IA alterado");
  };

  const saveInternalNotes = () => {
    if (!selected) return;
    updateSelectedConversation({ notes: notesDraft.trim() });
    toast.success("Observação interna salva");
  };

  const toggleResponsible = (sellerId: string) => {
    if (!selected || !isAdmin) return;
    const nextAssigned = assignedIds.includes(sellerId)
      ? assignedIds.filter(id => id !== sellerId)
      : [...assignedIds, sellerId];
    updateSelectedConversation({
      assignedSellerIds: nextAssigned,
      sellerId: nextAssigned[0] || selected.sellerId,
    });
  };

  const fakeMessages = selected ? [
    { from: "client", text: "Oi! Vi o anúncio de vocês", time: "10:14" },
    { from: "me", text: "Olá! Como posso ajudar?", time: "10:16" },
    { from: "client", text: selected.lastMessage, time: "10:18" },
  ] : [];

  return (
    <AppLayout title="Conversas" subtitle="Atendimento via WhatsApp">
      <div className="card-elevated flex min-h-[calc(100vh-180px)] flex-col overflow-hidden lg:h-[calc(100vh-180px)] lg:flex-row">
        <aside className="flex max-h-[46vh] w-full flex-col border-b border-border lg:max-h-none lg:w-80 lg:border-b-0 lg:border-r">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={conversationSearch}
                onChange={event => setConversationSearch(event.target.value)}
                placeholder="Buscar conversa..."
                className="border-transparent bg-secondary pl-9"
              />
            </div>
            <div className="mt-3 flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
              {statusFilters.map(filter => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStatusFilter(filter.id)}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                    statusFilter === filter.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {visibleConversations.map(conversation => {
              const responsible = sellerOptions.find(user => user.id === conversation.sellerId);
              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedId(conversation.id)}
                  className={cn("flex w-full items-start gap-3 border-b border-border/40 p-3 text-left transition-colors hover:bg-secondary/50",
                    selected?.id === conversation.id && "bg-primary-soft hover:bg-primary-soft")}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">{conversation.customer.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-semibold">{conversation.customer}</div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(conversation.lastInteraction), { locale: ptBR })}</span>
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">{conversation.phone}</div>
                    <p className="truncate text-xs text-muted-foreground">{conversation.lastMessage}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={conversationStatus(conversation)} />
                      <ClientTemperatureBadge temp={conversation.temperature} />
                      <span className="text-[10px] text-muted-foreground">{responsible?.name.split(" ")[0]}</span>
                      {!conversation.dealId && <span className="rounded-full bg-warning-soft px-1.5 py-0.5 text-[9px] font-semibold text-warning">sem card</span>}
                      {conversation.unread && <span className="ml-auto h-2 w-2 rounded-full bg-destructive" />}
                    </div>
                  </div>
                </button>
              );
            })}
            {visibleConversations.length === 0 && (
              <div className="p-3">
                <EmptyState title="Você ainda não possui conversas" description="Assim que novos contatos chegarem, eles aparecerão aqui." />
              </div>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-secondary/30">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center gap-3 border-b border-border bg-card p-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">{selected.customer.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold">{selected.customer}</div>
                    {selectedStatus && <StatusBadge status={selectedStatus} />}
                    <ClientTemperatureBadge temp={selected.temperature} />
                  </div>
                  <div className="text-xs text-muted-foreground">{selected.phone}</div>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => navigate(`/calendario?deal=${selected.dealId || ""}&lead=${encodeURIComponent(selected.customer)}&phone=${encodeURIComponent(selected.phone)}`)}>
                  <CalendarClock className="h-4 w-4" /> Agendar Atendimento
                </Button>
                {selectedDeal && (
                  <Button variant="outline" className="gap-2" asChild>
                    <Link to={`/kanban?deal=${selectedDeal.id}`}><KanbanSquare className="h-4 w-4" /> Ver Kanban</Link>
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setLeadActionsOpen(true)} title="Opções do lead">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-6">
                <div className="mx-auto flex max-w-md items-center gap-2 rounded-xl bg-info-soft p-3 text-xs text-info">
                  <Info className="h-4 w-4 shrink-0" /> Prévia do atendimento — integração com WhatsApp em configuração.
                </div>
                {fakeMessages.map((message, index) => (
                  <div key={index} className={cn("flex", message.from === "me" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                      message.from === "me" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card")}
                    >
                      <div>{message.text}</div>
                      <div className={cn("mt-1 text-[10px]", message.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground")}>{message.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 border-t border-border bg-card p-3">
                <Input disabled placeholder="Campo de resposta disponível após configurar a integração com WhatsApp" className="bg-secondary" />
                <Button disabled className="gap-2"><Lock className="h-4 w-4" /> WhatsApp em configuração</Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">Selecione uma conversa</div>
          )}
        </div>

        {selected && (
          <Dialog open={leadActionsOpen} onOpenChange={setLeadActionsOpen}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Opções do lead</DialogTitle>
              </DialogHeader>
              <div className="mb-4 flex items-center gap-3 rounded-xl bg-secondary p-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-primary font-semibold text-primary-foreground">{selected.customer.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  {editingName ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={nameDraft}
                        onChange={event => setNameDraft(event.target.value)}
                        className="h-9 font-semibold"
                        autoFocus
                        onKeyDown={event => {
                          if (event.key === "Enter") saveLeadName();
                          if (event.key === "Escape") setEditingName(false);
                        }}
                      />
                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={saveLeadName}><Check className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => { setNameDraft(selected.customer); setEditingName(false); }}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 truncate font-semibold">{selected.customer}</div>
                      {canEditLeadName && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingName(true)} title="Editar nome do lead">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">{selected.phone}</div>
                </div>
              </div>

              <div className="grid gap-5 text-sm md:grid-cols-2">
                <div>
                  <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Temperatura</div>
                  <Select value={selected.temperature} onValueChange={temperature => changeTemperature(temperature as Deal["temperature"])}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quente">Quente</SelectItem>
                      <SelectItem value="morno">Morno</SelectItem>
                      <SelectItem value="frio">Frio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Etapa do funil</div>
                  <Select value={selected.stage || stages[0]?.id || ""} onValueChange={changeStage}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Selecione a etapa" /></SelectTrigger>
                    <SelectContent>
                      {stages.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>{stage.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <div className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase text-muted-foreground">
                    <Bot className="h-3.5 w-3.5" /> Agente de IA
                  </div>
                  <div className="grid gap-3 rounded-xl border border-border/70 bg-background p-3 sm:grid-cols-[auto_1fr] sm:items-center">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Switch checked={Boolean(selected.aiEnabled)} onCheckedChange={toggleAI} />
                      <span>{selected.aiEnabled ? "Ligado" : "Desligado"}</span>
                    </label>
                    <Select value={selected.aiAgentId || activeAgents[0]?.id || agents[0]?.id || ""} onValueChange={changeAIAgent} disabled={agents.length === 0}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Selecionar agente" /></SelectTrigger>
                      <SelectContent>
                        {agents.map(agent => (
                          <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className={cn("grid gap-4 md:col-span-2", isAdmin ? "md:w-fit md:grid-cols-[minmax(180px,auto)_auto] md:items-start" : "md:grid-cols-1")}>
                  <div>
                    <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Responsáveis</div>
                    {assignedUsers.length ? (
                      <div className="space-y-1.5">
                        {assignedUsers.map(user => (
                          <div key={user.id} className="flex items-center gap-2">
                            <Avatar className="h-6 w-6"><AvatarFallback className="bg-primary-soft text-[10px] text-primary">{user.avatar}</AvatarFallback></Avatar>
                            <span>{user.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : <div className="text-xs text-muted-foreground">Nenhum responsável atribuído.</div>}
                  </div>
                  {isAdmin && (
                    <div className="md:w-28">
                      <div className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Atribuir acesso</div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" title="Atribuir vendedores">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[280px] p-2">
                          <div className="max-h-56 overflow-y-auto">
                            {sellerOptions.map(user => (
                              <label key={user.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-secondary">
                                <Checkbox checked={assignedIds.includes(user.id)} onCheckedChange={() => toggleResponsible(user.id)} />
                                <span className="truncate">{user.name}</span>
                              </label>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="text-[10px] font-semibold uppercase text-muted-foreground">Tags</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-7 w-7" title="Gerenciar tags">
                          <Tag className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-[320px] p-3">
                        <div className="mb-3 flex gap-2">
                          <Input id="new-conversation-tag" value={newTag} onChange={event => setNewTag(event.target.value)} placeholder="Nova tag" className="h-9" />
                          <Button variant="outline" size="icon" onClick={addTagToConversation}><Plus className="h-4 w-4" /></Button>
                        </div>
                        <div className="max-h-56 overflow-y-auto rounded-xl border border-border/70 bg-background p-2">
                          {tags.map(tag => (
                            <label key={tag} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-secondary">
                              <Checkbox checked={selected.tags.includes(tag)} onCheckedChange={() => toggleTag(tag)} />
                              <span className="truncate">{tag}</span>
                            </label>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selected.tags.map(tag => <TagBadge key={tag} label={tag} onRemove={() => toggleTag(tag)} />)}
                    {selected.tags.length === 0 && <span className="text-xs text-muted-foreground">Sem tags.</span>}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Observações internas</div>
                  <Textarea
                    value={notesDraft}
                    onChange={event => setNotesDraft(event.target.value)}
                    placeholder="Adicionar observação interna..."
                    rows={4}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button variant="outline" size="sm" onClick={saveInternalNotes}>Salvar observação</Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppLayout>
  );
}
