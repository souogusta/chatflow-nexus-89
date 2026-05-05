import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCRM } from "@/store/crm-store";
import { Deal } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientTemperatureBadge, TagBadge } from "@/components/shared/Badges";
import { Check, Lock, Info, Phone, MoreVertical, Pencil, Plus, KanbanSquare, Search, UserPlus, X } from "lucide-react";
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
    notes: "Lead novo aguardando qualificacao.",
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
});

export default function Conversas() {
  const { deals, addDeal, updateDeal, canViewDeal, currentUser, isAdmin, teamUsers, tags, setTags, stages, hasPermission } = useCRM();
  const [searchParams] = useSearchParams();
  const initialDealId = searchParams.get("deal");
  const query = searchParams.get("q")?.toLowerCase().trim() || "";
  const [conversationSearch, setConversationSearch] = useState(query);
  const [inboxConversations, setInboxConversations] = useState<Conversation[]>(initialInboxConversations);
  const [newTag, setNewTag] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [editingTemperature, setEditingTemperature] = useState(false);
  const [temperatureDraft, setTemperatureDraft] = useState<Deal["temperature"]>("morno");

  const sellerOptions = useMemo(() => teamUsers.filter(user => user.active && user.role !== "Administrador"), [teamUsers]);
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
  const visibleConversations = activeSearch
    ? conversations.filter(d =>
      d.customer.toLowerCase().includes(activeSearch) ||
      d.phone.toLowerCase().includes(activeSearch) ||
      d.lastMessage.toLowerCase().includes(activeSearch) ||
      d.tags.some(tag => tag.toLowerCase().includes(activeSearch))
    )
    : conversations;
  const selected = conversations.find(d => d.id === selectedId) || visibleConversations[0];
  const selectedDeal = selected?.dealId ? deals.find(deal => deal.id === selected.dealId) : null;
  const assignedIds = Array.from(new Set([selected?.sellerId, ...(selected?.assignedSellerIds || [])].filter(Boolean)));
  const assignedUsers = sellerOptions.filter(user => assignedIds.includes(user.id));
  const canEditLeadName = isAdmin || hasPermission("Editar atendimentos");

  useEffect(() => {
    setEditingName(false);
    setNameDraft(selected?.customer || "");
    setEditingTemperature(false);
    setTemperatureDraft(selected?.temperature || "morno");
  }, [selected?.id, selected?.customer]);

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

  const saveLeadTemperature = () => {
    if (!selected) return;
    updateSelectedConversation({ temperature: temperatureDraft });
    setEditingTemperature(false);
    toast.success("Temperatura do lead atualizada");
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

  const createKanbanCard = () => {
    if (!selected || selected.dealId) return;
    const assignedSellerIds = assignedIds.length ? assignedIds : [selected.sellerId];
    const newDeal: Deal = {
      id: `d-${Date.now()}`,
      customer: selected.customer,
      phone: selected.phone,
      lastMessage: selected.lastMessage,
      lastInteraction: selected.lastInteraction,
      sellerId: assignedSellerIds[0],
      assignedSellerIds,
      temperature: selected.temperature,
      tags: selected.tags,
      unread: selected.unread,
      estimatedValue: 0,
      stage: stages[0]?.id || "novo-lead",
      notes: selected.notes,
    };
    addDeal(newDeal);
    setInboxConversations(current => current.filter(conversation => conversation.id !== selected.id));
    setSelectedId(`deal-${newDeal.id}`);
    toast.success("Card criado no Kanban");
  };

  const fakeMessages = selected ? [
    { from: "client", text: "Oi! Vi o anuncio de voces", time: "10:14" },
    { from: "me", text: "Ola! Como posso ajudar?", time: "10:16" },
    { from: "client", text: selected.lastMessage, time: "10:18" },
  ] : [];

  return (
    <AppLayout title="Conversas" subtitle="Atendimento via WhatsApp">
      <div className="card-elevated overflow-hidden h-[calc(100vh-180px)] flex">
        <aside className="w-80 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={conversationSearch}
                onChange={event => setConversationSearch(event.target.value)}
                placeholder="Buscar conversa..."
                className="pl-9 bg-secondary border-transparent"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {visibleConversations.map(d => {
              const responsible = sellerOptions.find(user => user.id === d.sellerId);
              return (
                <button key={d.id} onClick={() => setSelectedId(d.id)}
                  className={cn("w-full flex items-start gap-3 p-3 text-left border-b border-border/40 hover:bg-secondary/50 transition-colors",
                    selected?.id === d.id && "bg-primary-soft hover:bg-primary-soft")}>
                  <Avatar className="w-10 h-10"><AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">{d.customer.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm truncate">{d.customer}</div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatDistanceToNow(new Date(d.lastInteraction), { locale: ptBR })}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{d.lastMessage}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-muted-foreground">{responsible?.name.split(" ")[0]}</span>
                      {!d.dealId && <span className="rounded-full bg-warning-soft px-1.5 py-0.5 text-[9px] font-semibold text-warning">sem card</span>}
                      {d.unread && <span className="ml-auto w-2 h-2 rounded-full bg-destructive" />}
                    </div>
                  </div>
                </button>
              );
            })}
            {visibleConversations.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">Nenhuma conversa encontrada.</div>
            )}
          </div>
        </aside>

        <div className="flex-1 flex flex-col bg-secondary/30 min-w-0">
          {selected ? (
            <>
              <div className="bg-card border-b border-border p-3 flex items-center gap-3">
                <Avatar className="w-10 h-10"><AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">{selected.customer.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{selected.customer}</div>
                  <div className="text-xs text-muted-foreground">{selected.phone}</div>
                </div>
                <Button variant="outline" className="gap-2" disabled={Boolean(selected.dealId)} onClick={createKanbanCard}>
                  <KanbanSquare className="w-4 h-4" /> {selected.dealId ? "Card ja existe" : "Criar card"}
                </Button>
                {selectedDeal && (
                  <Button variant="outline" className="gap-2" asChild>
                    <Link to={`/kanban?deal=${selectedDeal.id}`}><KanbanSquare className="w-4 h-4" /> Ver Kanban</Link>
                  </Button>
                )}
                <Button variant="ghost" size="icon"><Phone className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                <div className="bg-warning-soft text-warning text-xs rounded-xl p-3 flex items-center gap-2 max-w-md mx-auto">
                  <Info className="w-4 h-4 shrink-0" /> Modulo de conversas sera integrado ao WhatsApp posteriormente.
                </div>
                {fakeMessages.map((m, i) => (
                  <div key={i} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                      m.from === "me" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card rounded-bl-sm")}>
                      <div>{m.text}</div>
                      <div className={cn("text-[10px] mt-1", m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground")}>{m.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-card border-t border-border p-3 flex items-center gap-2">
                <Input disabled placeholder="Em breve - integracao com WhatsApp" className="bg-secondary" />
                <Button disabled className="gap-2"><Lock className="w-4 h-4" /> Em breve</Button>
              </div>
            </>
          ) : <div className="flex-1 flex items-center justify-center text-muted-foreground">Selecione uma conversa</div>}
        </div>

        {selected && (
          <aside className="w-80 border-l border-border p-5 overflow-y-auto bg-card">
            <div className="text-center mb-4">
              <Avatar className="w-16 h-16 mx-auto mb-2"><AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">{selected.customer.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
              <div className="flex items-center justify-center gap-2">
                {editingName ? (
                  <div className="flex w-full items-center gap-1">
                    <Input
                      value={nameDraft}
                      onChange={event => setNameDraft(event.target.value)}
                      className="h-9 text-center font-semibold"
                      autoFocus
                      onKeyDown={event => {
                        if (event.key === "Enter") saveLeadName();
                        if (event.key === "Escape") setEditingName(false);
                      }}
                    />
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={saveLeadName}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => { setNameDraft(selected.customer); setEditingName(false); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0 truncate font-semibold">{selected.customer}</div>
                    {canEditLeadName && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingName(true)} title="Editar nome do lead">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{selected.phone}</div>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Temperatura</div>
                {editingTemperature ? (
                  <div className="flex items-center gap-1">
                    <Select value={temperatureDraft} onValueChange={temperature => setTemperatureDraft(temperature as Deal["temperature"])}>
                      <SelectTrigger className="h-9 flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quente">Quente</SelectItem>
                        <SelectItem value="morno">Morno</SelectItem>
                        <SelectItem value="frio">Frio</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={saveLeadTemperature}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => { setTemperatureDraft(selected.temperature); setEditingTemperature(false); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <ClientTemperatureBadge temp={selected.temperature} size="md" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingTemperature(true)} title="Editar temperatura do lead">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Etapa do funil</div>
                <div className="text-sm font-medium">{selected.stage || "Ainda sem card"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Responsaveis</div>
                {assignedUsers.length ? (
                  <div className="space-y-1.5">
                    {assignedUsers.map(user => (
                      <div key={user.id} className="flex items-center gap-2">
                        <Avatar className="w-6 h-6"><AvatarFallback className="bg-primary-soft text-primary text-[10px]">{user.avatar}</AvatarFallback></Avatar>
                        <span>{user.name}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-xs text-muted-foreground">Nenhum responsavel atribuido.</div>}
              </div>

              {isAdmin && (
                <div>
                  <div className="mb-2 flex items-center gap-1 text-[10px] uppercase font-semibold text-muted-foreground">
                    <UserPlus className="h-3.5 w-3.5" /> Atribuir acesso
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-border/70 bg-background p-2">
                    {sellerOptions.map(user => (
                      <label key={user.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-secondary">
                        <Checkbox checked={assignedIds.includes(user.id)} onCheckedChange={() => toggleResponsible(user.id)} />
                        <span className="truncate">{user.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Tags</div>
                <div className="mb-2 flex flex-wrap gap-1">
                  {selected.tags.map(t => <TagBadge key={t} label={t} onRemove={() => toggleTag(t)} />)}
                  {selected.tags.length === 0 && <span className="text-xs text-muted-foreground">Sem tags.</span>}
                </div>
                <div className="grid gap-2">
                  <div className="flex gap-2">
                    <Input value={newTag} onChange={event => setNewTag(event.target.value)} placeholder="Nova tag" className="h-9" />
                    <Button variant="outline" size="icon" onClick={addTagToConversation}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="max-h-28 overflow-y-auto rounded-xl border border-border/70 bg-background p-2">
                    {tags.map(tag => (
                      <label key={tag} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-secondary">
                        <Checkbox checked={selected.tags.includes(tag)} onCheckedChange={() => toggleTag(tag)} />
                        <span className="truncate">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Observacoes internas</div>
                <p className="text-xs bg-secondary p-2 rounded-lg">{selected.notes || "Nenhuma observacao."}</p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </AppLayout>
  );
}
