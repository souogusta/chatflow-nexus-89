import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCRM } from "@/store/crm-store";
import { cn } from "@/lib/utils";
import { BadgeCheck, MessageSquareText, Send } from "lucide-react";
import { toast } from "sonner";

type CampaignStatus = "rodando" | "pausada" | "finalizada";

type CampaignSummary = {
  id: string;
  name: string;
  audience: number;
  sent: number;
  responses: number;
  status: CampaignStatus;
};

const runningCampaigns: CampaignSummary[] = [
  { id: "c1", name: "Retorno leads quentes", audience: 64, sent: 42, responses: 13, status: "rodando" },
  { id: "c2", name: "Orcamento sem resposta", audience: 38, sent: 38, responses: 7, status: "pausada" },
];

const previousCampaigns: CampaignSummary[] = [
  { id: "c3", name: "Reativacao Instagram", audience: 120, sent: 120, responses: 31, status: "finalizada" },
  { id: "c4", name: "Clientes frios 30 dias", audience: 86, sent: 86, responses: 14, status: "finalizada" },
  { id: "c5", name: "Follow-up pos proposta", audience: 52, sent: 52, responses: 18, status: "finalizada" },
];

const syntaxOptions = [
  { label: "Nome do cliente", token: "{{nome_cliente}}" },
  { label: "Numero", token: "{{numero_cliente}}" },
];

const daysSince = (value: string) => {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return 0;
  return Math.floor((Date.now() - time) / 86400000);
};

const responseRate = (campaign: CampaignSummary) =>
  campaign.sent ? Math.round((campaign.responses / campaign.sent) * 100) : 0;

const renderPreview = (message: string, deal?: { customer: string; phone: string }) =>
  message
    .replaceAll("{{nome_cliente}}", deal?.customer || "Marina Souza")
    .replaceAll("{{numero_cliente}}", deal?.phone || "+55 11 99999-0000");

function CampaignList({ title, items }: { title: string; items: CampaignSummary[] }) {
  return (
    <section className="card-elevated p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-bold">{title}</h2>
        <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-semibold text-muted-foreground">{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map(campaign => {
          const rate = responseRate(campaign);
          return (
            <div key={campaign.id} className="rounded-xl border border-border/60 bg-background p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{campaign.name}</div>
                  <div className="text-xs text-muted-foreground">{campaign.sent}/{campaign.audience} envios</div>
                </div>
                <span className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  campaign.status === "rodando" && "bg-success-soft text-success",
                  campaign.status === "pausada" && "bg-warning-soft text-warning",
                  campaign.status === "finalizada" && "bg-muted text-muted-foreground",
                )}>
                  {campaign.status}
                </span>
              </div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Taxa de resposta</span>
                <span className="font-semibold">{rate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function Campanhas() {
  const { deals, tags, teamUsers, canViewDeal } = useCRM();
  const [name, setName] = useState("Remarketing sem resposta");
  const [selectedSellerIds, setSelectedSellerIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [temperature, setTemperature] = useState("all");
  const [lastContact, setLastContact] = useState("all");
  const [returnStatus, setReturnStatus] = useState("all");
  const [message, setMessage] = useState("Oi {{nome_cliente}}, tudo bem? Vi que nosso ultimo contato ficou em aberto e queria saber se ainda posso te ajudar pelo WhatsApp {{numero_cliente}}.");

  const sellerOptions = useMemo(() => teamUsers.filter(user => user.active && user.role !== "Administrador"), [teamUsers]);
  const audience = useMemo(() => deals.filter(deal => {
    const days = daysSince(deal.lastInteraction);
    return canViewDeal(deal)
      && (selectedSellerIds.length === 0 || selectedSellerIds.includes(deal.sellerId))
      && (selectedTags.length === 0 || selectedTags.some(tag => deal.tags.includes(tag)))
      && (temperature === "all" || deal.temperature === temperature)
      && (returnStatus === "all" || (returnStatus === "cliente-aguardando" ? deal.unread : !deal.unread))
      && (lastContact === "all"
        || (lastContact === "7d" && days >= 7)
        || (lastContact === "15d" && days >= 15)
        || (lastContact === "30d" && days >= 30));
  }), [canViewDeal, deals, lastContact, returnStatus, selectedSellerIds, selectedTags, temperature]);
  const previewDeal = audience[0];

  const toggleSeller = (sellerId: string) => {
    setSelectedSellerIds(current => current.includes(sellerId) ? current.filter(id => id !== sellerId) : [...current, sellerId]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(current => current.includes(tag) ? current.filter(item => item !== tag) : [...current, tag]);
  };

  const insertToken = (token: string) => {
    setMessage(current => `${current}${current.endsWith(" ") || !current ? "" : " "}${token}`);
  };

  const createCampaign = () => {
    if (!name.trim()) return toast.error("Informe o nome da campanha");
    if (!message.trim()) return toast.error("Informe a mensagem da campanha");
    if (audience.length === 0) return toast.error("Nenhum lead encontrado para estes filtros");
    toast.success("Campanha de remarketing preparada");
  };

  return (
    <AppLayout title="Campanha" subtitle="Crie listas de remarketing e acompanhe respostas">
      <section className="card-elevated mb-6 p-6">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">Nova campanha de remarketing</h2>
            <p className="text-sm text-muted-foreground">Monte uma lista filtrada e personalize a mensagem antes do disparo.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-secondary px-4 py-3">
              <div className="text-lg font-bold">{audience.length}</div>
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">leads</div>
            </div>
            <div className="rounded-xl bg-secondary px-4 py-3">
              <div className="text-lg font-bold">{selectedTags.length || tags.length}</div>
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">tags</div>
            </div>
            <div className="rounded-xl bg-secondary px-4 py-3">
              <div className="text-lg font-bold">{selectedSellerIds.length || sellerOptions.length}</div>
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">vendedores</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div>
              <Label>Nome da campanha</Label>
              <Input value={name} onChange={event => setName(event.target.value)} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <Label>Periodo do ultimo contato</Label>
                <Select value={lastContact} onValueChange={setLastContact}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Qualquer periodo</SelectItem>
                    <SelectItem value="7d">Ha 7 dias ou mais</SelectItem>
                    <SelectItem value="15d">Ha 15 dias ou mais</SelectItem>
                    <SelectItem value="30d">Ha 30 dias ou mais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Temperatura</Label>
                <Select value={temperature} onValueChange={setTemperature}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="quente">Quente</SelectItem>
                    <SelectItem value="morno">Morno</SelectItem>
                    <SelectItem value="frio">Frio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Retorno</Label>
                <Select value={returnStatus} onValueChange={setReturnStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="cliente-aguardando">Cliente aguardando</SelectItem>
                    <SelectItem value="aguardando-cliente">Aguardando cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Vendedores</Label>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelectedSellerIds([])}>Todos</Button>
                </div>
                <div className="max-h-44 overflow-y-auto rounded-xl border border-border/70 bg-background p-2">
                  {sellerOptions.map(seller => (
                    <label key={seller.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-secondary">
                      <Checkbox checked={selectedSellerIds.includes(seller.id)} onCheckedChange={() => toggleSeller(seller.id)} />
                      <span className="truncate">{seller.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Tags</Label>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelectedTags([])}>Todas</Button>
                </div>
                <div className="max-h-44 overflow-y-auto rounded-xl border border-border/70 bg-background p-2">
                  {tags.map(tag => (
                    <label key={tag} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-secondary">
                      <Checkbox checked={selectedTags.includes(tag)} onCheckedChange={() => toggleTag(tag)} />
                      <span className="truncate">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Mensagem personalizada</Label>
              <Textarea value={message} onChange={event => setMessage(event.target.value)} rows={8} className="mt-1" />
            </div>
            <div className="flex flex-wrap gap-2">
              {syntaxOptions.map(option => (
                <Button key={option.token} type="button" variant="outline" size="sm" className="gap-2" onClick={() => insertToken(option.token)}>
                  <BadgeCheck className="h-3.5 w-3.5" /> {option.label}
                </Button>
              ))}
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <MessageSquareText className="h-4 w-4" /> Previa da mensagem
              </div>
              <div className="whitespace-pre-wrap text-sm">{renderPreview(message, previewDeal)}</div>
            </div>
            <Button className="w-full gap-2 bg-gradient-primary" onClick={createCampaign}>
              <Send className="h-4 w-4" /> Preparar campanha
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CampaignList title="Campanhas rodando atualmente" items={runningCampaigns} />
        <CampaignList title="Campanhas anteriores" items={previousCampaigns} />
      </div>
    </AppLayout>
  );
}
