import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCRM } from "@/store/crm-store";
import { SELLERS } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClientTemperatureBadge, TagBadge } from "@/components/shared/Badges";
import { Search, Send, Lock, Info, Phone, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Conversas() {
  const { deals } = useCRM();
  const [selectedId, setSelectedId] = useState(deals[0]?.id);
  const selected = deals.find(d => d.id === selectedId);
  const seller = SELLERS.find(s => s.id === selected?.sellerId);

  const fakeMessages = selected ? [
    { from: "client", text: "Oi! Vi o anúncio de vocês", time: "10:14" },
    { from: "me", text: "Olá! Que bom te ver por aqui 😊 Como posso ajudar?", time: "10:16" },
    { from: "client", text: selected.lastMessage, time: "10:18" },
  ] : [];

  return (
    <AppLayout title="Conversas" subtitle="Atendimento via WhatsApp">
      <div className="card-elevated overflow-hidden h-[calc(100vh-180px)] flex">
        {/* List */}
        <aside className="w-80 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar conversa..." className="pl-9 bg-secondary border-transparent" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {deals.map(d => {
              const s = SELLERS.find(x => x.id === d.sellerId);
              return (
                <button key={d.id} onClick={() => setSelectedId(d.id)}
                  className={cn("w-full flex items-start gap-3 p-3 text-left border-b border-border/40 hover:bg-secondary/50 transition-colors",
                    selectedId === d.id && "bg-primary-soft hover:bg-primary-soft")}>
                  <Avatar className="w-10 h-10"><AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">{d.customer.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm truncate">{d.customer}</div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatDistanceToNow(new Date(d.lastInteraction), { locale: ptBR })}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{d.lastMessage}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-muted-foreground">{s?.name.split(" ")[0]}</span>
                      {d.unread && <span className="ml-auto w-2 h-2 rounded-full bg-destructive" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center */}
        <div className="flex-1 flex flex-col bg-secondary/30 min-w-0">
          {selected ? (
            <>
              <div className="bg-card border-b border-border p-3 flex items-center gap-3">
                <Avatar className="w-10 h-10"><AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">{selected.customer.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{selected.customer}</div>
                  <div className="text-xs text-muted-foreground">{selected.phone}</div>
                </div>
                <Button variant="ghost" size="icon"><Phone className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                <div className="bg-warning-soft text-warning text-xs rounded-xl p-3 flex items-center gap-2 max-w-md mx-auto">
                  <Info className="w-4 h-4 shrink-0" /> Módulo de conversas será integrado ao WhatsApp posteriormente.
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
                <Input disabled placeholder="Em breve — integração com WhatsApp" className="bg-secondary" />
                <Button disabled className="gap-2"><Lock className="w-4 h-4" /> Em breve</Button>
              </div>
            </>
          ) : <div className="flex-1 flex items-center justify-center text-muted-foreground">Selecione uma conversa</div>}
        </div>

        {/* Right */}
        {selected && (
          <aside className="w-72 border-l border-border p-5 overflow-y-auto bg-card">
            <div className="text-center mb-4">
              <Avatar className="w-16 h-16 mx-auto mb-2"><AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">{selected.customer.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
              <div className="font-semibold">{selected.customer}</div>
              <div className="text-xs text-muted-foreground">{selected.phone}</div>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Temperatura</div>
                <ClientTemperatureBadge temp={selected.temperature} size="md" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Etapa do funil</div>
                <div className="text-sm font-medium">{selected.stage}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Responsável</div>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6"><AvatarFallback className="bg-primary-soft text-primary text-[10px]">{seller?.avatar}</AvatarFallback></Avatar>
                  <span>{seller?.name}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Tags</div>
                <div className="flex flex-wrap gap-1">{selected.tags.map(t => <TagBadge key={t} label={t} />)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Observações internas</div>
                <p className="text-xs bg-secondary p-2 rounded-lg">{selected.notes || "Nenhuma observação."}</p>
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Histórico resumido</div>
                <ul className="text-xs space-y-1.5 text-muted-foreground">
                  <li>• Lead criado há 3 dias</li>
                  <li>• Movido para negociação</li>
                  <li>• 12 mensagens trocadas</li>
                </ul>
              </div>
            </div>
          </aside>
        )}
      </div>
    </AppLayout>
  );
}
