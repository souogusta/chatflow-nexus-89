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
import { BadgeCheck, Download, MessageSquareText, Pause, Play, RotateCcw, Send, Square } from "lucide-react";
import { toast } from "sonner";

type CampaignStatus = "rodando" | "pausada" | "finalizada";

type CampaignSummary = {
  id: string;
  name: string;
  audience: number;
  sent: number;
  responses: number;
  status: CampaignStatus;
  createdAt: string;
  message: string;
  reportRows: CampaignReportRow[];
};

type CampaignReportRow = {
  name: string;
  phone: string;
  origin: string;
  status: string;
};

const runningCampaigns: CampaignSummary[] = [
  { id: "c1", name: "Retorno leads quentes", audience: 64, sent: 42, responses: 13, status: "rodando", createdAt: "2026-04-30T09:10:00", message: "Retorno para leads quentes", reportRows: [] },
  { id: "c2", name: "Orcamento sem resposta", audience: 38, sent: 38, responses: 7, status: "pausada", createdAt: "2026-04-29T15:20:00", message: "Follow-up de orcamento", reportRows: [] },
];

const previousCampaigns: CampaignSummary[] = [
  { id: "c3", name: "Reativacao Instagram", audience: 120, sent: 120, responses: 31, status: "finalizada", createdAt: "2026-04-26T11:00:00", message: "Reativacao de Instagram", reportRows: [] },
  { id: "c4", name: "Clientes frios 30 dias", audience: 86, sent: 86, responses: 14, status: "finalizada", createdAt: "2026-04-22T10:30:00", message: "Clientes frios 30 dias", reportRows: [] },
  { id: "c5", name: "Follow-up pos proposta", audience: 52, sent: 52, responses: 18, status: "finalizada", createdAt: "2026-04-18T16:40:00", message: "Follow-up pos proposta", reportRows: [] },
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

const parseCsvNumbers = (value: string) =>
  Array.from(new Set(value.split(/[\n,;]+/).map(item => item.trim()).filter(Boolean)));

const csvEscape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
  const csv = rows.map(row => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const buildFallbackReportRows = (campaign: CampaignSummary): CampaignReportRow[] =>
  Array.from({ length: Math.min(campaign.audience, 12) }, (_, index) => ({
    name: `Contato ${index + 1}`,
    phone: `+55 11 9${String(index + 1).padStart(4, "0")}-${String(1000 + index).padStart(4, "0")}`,
    origin: campaign.name,
    status: index < campaign.responses ? "respondeu" : "enviado",
  }));

const renderPreview = (message: string, deal?: { customer: string; phone: string }) =>
  message
    .replaceAll("{{nome_cliente}}", deal?.customer || "Marina Souza")
    .replaceAll("{{numero_cliente}}", deal?.phone || "+55 11 99999-0000");

function CampaignList({
  title,
  items,
  mode,
  onTogglePause,
  onStop,
  onDownload,
  onRedo,
}: {
  title: string;
  items: CampaignSummary[];
  mode: "running" | "previous";
  onTogglePause?: (campaignId: string) => void;
  onStop?: (campaignId: string) => void;
  onDownload?: (campaign: CampaignSummary) => void;
  onRedo?: (campaign: CampaignSummary) => void;
}) {
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
              <div className="mt-4 flex flex-wrap gap-2">
                {mode === "running" ? (
                  <>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => onTogglePause?.(campaign.id)}>
                      {campaign.status === "pausada" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      {campaign.status === "pausada" ? "Continuar" : "Pausar"}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => onStop?.(campaign.id)}>
                      <Square className="h-4 w-4" /> Parar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => onDownload?.(campaign)}>
                      <Download className="h-4 w-4" /> Relatorio CSV
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => onRedo?.(campaign)}>
                      <RotateCcw className="h-4 w-4" /> Refazer
                    </Button>
                  </>
                )}
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
  const [activeCampaigns, setActiveCampaigns] = useState<CampaignSummary[]>(runningCampaigns);
  const [closedCampaigns, setClosedCampaigns] = useState<CampaignSummary[]>(previousCampaigns);
  const [name, setName] = useState("Remarketing sem resposta");
  const [selectedSellerIds, setSelectedSellerIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [clientFilter, setClientFilter] = useState("all");
  const [temperature, setTemperature] = useState("all");
  const [lastContact, setLastContact] = useState("all");
  const [returnStatus, setReturnStatus] = useState("all");
  const [csvNumbers, setCsvNumbers] = useState("");
  const [message, setMessage] = useState("Oi {{nome_cliente}}, tudo bem? Vi que nosso ultimo contato ficou em aberto e queria saber se ainda posso te ajudar pelo WhatsApp {{numero_cliente}}.");

  const sellerOptions = useMemo(() => teamUsers.filter(user => user.active && user.role !== "Administrador"), [teamUsers]);
  const audience = useMemo(() => deals.filter(deal => {
    const days = daysSince(deal.lastInteraction);
    return canViewDeal(deal)
      && (selectedSellerIds.length === 0 || selectedSellerIds.includes(deal.sellerId))
      && (selectedTags.length === 0 || selectedTags.some(tag => deal.tags.includes(tag)))
      && (clientFilter === "all"
        || (clientFilter === "retornar-hoje" && deal.tags.includes("Retornar hoje"))
        || (clientFilter === "sem-resposta" && deal.stage === "aguardando-resposta")
        || (clientFilter === "proposta-pendente" && deal.tags.includes("Enviar proposta"))
        || (clientFilter === "nao-lidos" && deal.unread))
      && (temperature === "all" || deal.temperature === temperature)
      && (returnStatus === "all" || (returnStatus === "cliente-aguardando" ? deal.unread : !deal.unread))
      && (lastContact === "all"
        || (lastContact === "7d" && days >= 7)
        || (lastContact === "15d" && days >= 15)
        || (lastContact === "30d" && days >= 30));
  }), [canViewDeal, clientFilter, deals, lastContact, returnStatus, selectedSellerIds, selectedTags, temperature]);
  const importedNumbers = useMemo(() => parseCsvNumbers(csvNumbers), [csvNumbers]);
  const totalAudience = audience.length + importedNumbers.length;
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
    if (totalAudience === 0) return toast.error("Nenhum lead encontrado para estes filtros ou lista CSV");
    const reportRows: CampaignReportRow[] = [
      ...audience.map(deal => ({
        name: deal.customer,
        phone: deal.phone,
        origin: "Filtro CRM",
        status: "pendente",
      })),
      ...importedNumbers.map((phone, index) => ({
        name: `CSV ${index + 1}`,
        phone,
        origin: "Lista CSV",
        status: "pendente",
      })),
    ];
    setActiveCampaigns(current => [{
      id: `c-${Date.now()}`,
      name: name.trim(),
      audience: totalAudience,
      sent: 0,
      responses: 0,
      status: "rodando",
      createdAt: new Date().toISOString(),
      message: message.trim(),
      reportRows,
    }, ...current]);
    toast.success("Campanha de remarketing preparada");
  };

  const toggleCampaignPause = (campaignId: string) => {
    setActiveCampaigns(current => current.map(campaign =>
      campaign.id === campaignId
        ? { ...campaign, status: campaign.status === "pausada" ? "rodando" : "pausada" }
        : campaign
    ));
  };

  const stopCampaign = (campaignId: string) => {
    const campaign = activeCampaigns.find(item => item.id === campaignId);
    if (!campaign) return;
    setActiveCampaigns(current => current.filter(item => item.id !== campaignId));
    setClosedCampaigns(current => [{ ...campaign, status: "finalizada" }, ...current]);
    toast.success("Campanha parada e movida para anteriores");
  };

  const downloadCampaignReport = (campaign: CampaignSummary) => {
    const rows = campaign.reportRows.length ? campaign.reportRows : buildFallbackReportRows(campaign);
    downloadCsv(`relatorio-${campaign.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`, [
      ["campanha", "criada_em", "publico", "enviados", "respostas", "nome", "telefone", "origem", "status"],
      ...rows.map(row => [
        campaign.name,
        new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(campaign.createdAt)),
        campaign.audience,
        campaign.sent,
        campaign.responses,
        row.name,
        row.phone,
        row.origin,
        row.status,
      ]),
    ]);
  };

  const redoCampaign = (campaign: CampaignSummary) => {
    setName(campaign.name);
    setMessage(campaign.message);
    setCsvNumbers(campaign.reportRows.filter(row => row.origin === "Lista CSV").map(row => row.phone).join("\n"));
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Campanha carregada para refazer");
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
              <div className="text-lg font-bold">{totalAudience}</div>
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">leads</div>
            </div>
            <div className="rounded-xl bg-secondary px-4 py-3">
              <div className="text-lg font-bold">{selectedTags.length || tags.length}</div>
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">tags</div>
            </div>
            <div className="rounded-xl bg-secondary px-4 py-3">
              <div className="text-lg font-bold">{importedNumbers.length}</div>
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">csv</div>
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
                <Label>Clientes para disparar</Label>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos elegiveis</SelectItem>
                    <SelectItem value="retornar-hoje">Precisam retorno hoje</SelectItem>
                    <SelectItem value="sem-resposta">Sem resposta</SelectItem>
                    <SelectItem value="proposta-pendente">Proposta pendente</SelectItem>
                    <SelectItem value="nao-lidos">Nao lidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

            <div>
              <Label>Lista de numeros em CSV</Label>
              <Textarea
                value={csvNumbers}
                onChange={event => setCsvNumbers(event.target.value)}
                rows={4}
                className="mt-1"
                placeholder="+55 11 99999-0000, +55 11 98888-0000"
              />
              <p className="mt-1 text-xs text-muted-foreground">Separe os numeros por virgula, ponto e virgula ou linha. Estes contatos entram junto com os filtros do CRM.</p>
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
        <CampaignList title="Campanhas rodando atualmente" items={activeCampaigns} mode="running" onTogglePause={toggleCampaignPause} onStop={stopCampaign} />
        <CampaignList title="Campanhas anteriores" items={closedCampaigns} mode="previous" onDownload={downloadCampaignReport} onRedo={redoCampaign} />
      </div>
    </AppLayout>
  );
}
