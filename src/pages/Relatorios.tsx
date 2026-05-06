import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCRM } from "@/store/crm-store";
import { SELLERS, REFUSAL_REASONS, MONTHLY_SERIES, REFUSAL_PIE } from "@/lib/mock-data";
import { ClientTemperatureBadge, TagBadge } from "@/components/shared/Badges";
import { Download, FileSpreadsheet, Play, FileText, Users, Bot, Flame, AlertTriangle, History, ShoppingBag, X, Share2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const REPORTS = [
  { id: "atendimentos", name: "Atendimentos", desc: "Todos os atendimentos do período", icon: FileText },
  { id: "vendas", name: "Vendas", desc: "Vendas realizadas com valor e produto", icon: ShoppingBag },
  { id: "recusas", name: "Recusas", desc: "Vendas perdidas e seus motivos", icon: X },
  { id: "sem-resposta", name: "Conversas sem resposta", desc: "Clientes aguardando retorno", icon: AlertTriangle },
  { id: "vendedoras", name: "Performance por vendedora", desc: "Métricas individuais da equipe", icon: Users },
  { id: "agentes", name: "Performance por agente IA", desc: "Eficiência dos agentes automáticos", icon: Bot },
  { id: "quentes", name: "Clientes quentes", desc: "Leads com alta probabilidade de compra", icon: Flame },
  { id: "kanban", name: "Histórico completo do Kanban", desc: "Movimentações entre etapas", icon: History },
];

const daysByPeriod: Record<string, number> = { today: 1, "7d": 7, "30d": 30, "90d": 90 };
const refusalByStage: Record<string, string> = {
  perdido: "Comprou com concorrente",
  "aguardando-resposta": "Não respondeu mais",
};

const getRefusalReason = (deal: { stage: string; tags: string[]; notes?: string; lastMessage: string }) => {
  const searchable = `${deal.lastMessage} ${deal.notes || ""} ${deal.tags.join(" ")}`.toLowerCase();
  if (searchable.includes("preço") || searchable.includes("preco") || searchable.includes("caro") || searchable.includes("desconto")) return "Preço alto";
  if (searchable.includes("orçamento") || searchable.includes("orcamento")) return "Cliente sem orçamento";
  if (searchable.includes("concorrente") || searchable.includes("fornecedor")) return "Comprou com concorrente";
  if (searchable.includes("pesquisando")) return "Está apenas pesquisando";
  return refusalByStage[deal.stage] || "Outros";
};

const escapeHtml = (value: string | number | undefined) =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[char] || char));

const buildLineChartSvg = (series: typeof MONTHLY_SERIES) => {
  const width = 680;
  const height = 260;
  const padding = 34;
  const max = Math.max(...series.map(item => item.atendimentos), 1);
  const points = series.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(series.length - 1, 1);
    const y = height - padding - (item.atendimentos / max) * (height - padding * 2);
    return { x, y, item };
  });

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" rx="12" fill="#f8fafc"/>
      <text x="24" y="26" font-size="15" font-weight="700" fill="#0f172a">Atendimentos por dia</text>
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#cbd5e1"/>
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#cbd5e1"/>
      <polyline points="${points.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ")}" fill="none" stroke="#2563eb" stroke-width="3"/>
      ${points.map(point => `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="3" fill="#2563eb"/>`).join("")}
      ${points.filter((_, index) => index % 5 === 0 || index === points.length - 1).map(point => `<text x="${point.x.toFixed(1)}" y="${height - 8}" font-size="10" text-anchor="middle" fill="#64748b">${escapeHtml(point.item.day)}</text>`).join("")}
    </svg>
  `;
};

const buildPieChartSvg = (data: typeof REFUSAL_PIE) => {
  const colors = ["#2563eb", "#0891b2", "#f59e0b", "#ef4444", "#16a34a", "#64748b"];
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let cumulative = 0;
  const slices = data.map((item, index) => {
    const start = cumulative / total;
    cumulative += item.value;
    const end = cumulative / total;
    const startAngle = start * Math.PI * 2 - Math.PI / 2;
    const endAngle = end * Math.PI * 2 - Math.PI / 2;
    const x1 = 130 + 86 * Math.cos(startAngle);
    const y1 = 130 + 86 * Math.sin(startAngle);
    const x2 = 130 + 86 * Math.cos(endAngle);
    const y2 = 130 + 86 * Math.sin(endAngle);
    const largeArc = end - start > 0.5 ? 1 : 0;
    return `<path d="M 130 130 L ${x1.toFixed(2)} ${y1.toFixed(2)} A 86 86 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${colors[index % colors.length]}"/>`;
  }).join("");
  const legend = data.map((item, index) => `
    <div style="margin:4px 0;font-size:12px;">
      <span style="display:inline-block;width:10px;height:10px;background:${colors[index % colors.length]};margin-right:6px;"></span>
      ${escapeHtml(item.name)} - ${item.value}%
    </div>
  `).join("");

  return `
    <div style="display:flex;gap:20px;align-items:center;">
      <svg width="260" height="260" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" rx="12" fill="#f8fafc"/>
        ${slices}
        <circle cx="130" cy="130" r="44" fill="#f8fafc"/>
        <text x="130" y="126" font-size="13" font-weight="700" fill="#0f172a" text-anchor="middle">Recusas</text>
        <text x="130" y="144" font-size="12" fill="#64748b" text-anchor="middle">${total} pontos</text>
      </svg>
      <div>${legend}</div>
    </div>
  `;
};

export default function Relatorios() {
  const { deals, agents, stages, canViewDeal, isAdmin, currentUser, hasPermission } = useCRM();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState(searchParams.get("report") || "atendimentos");
  const [period, setPeriod] = useState(searchParams.get("period") || "30d");
  const [customStart, setCustomStart] = useState(searchParams.get("start") || "2026-04-01");
  const [customEnd, setCustomEnd] = useState(searchParams.get("end") || "2026-04-28");
  const [seller, setSeller] = useState(searchParams.get("seller") || "all");
  const [stage, setStage] = useState(searchParams.get("stage") || "all");
  const [temperature, setTemperature] = useState(searchParams.get("temp") || "all");
  const [result, setResult] = useState(searchParams.get("result") || "all");
  const [reason, setReason] = useState(searchParams.get("reason") || "all");
  const [channel, setChannel] = useState(searchParams.get("channel") || "all");
  const [minValue, setMinValue] = useState(searchParams.get("minValue") || "");

  const filteredDeals = useMemo(() => {
    const cutoff = Date.now() - (daysByPeriod[period] ?? 30) * 86400000;
    const startDate = new Date(`${customStart}T00:00:00`).getTime();
    const endDate = new Date(`${customEnd}T23:59:59`).getTime();
    return deals.filter(deal => {
      const interactionTime = +new Date(deal.lastInteraction);
      const dealResult = deal.stage === "fechado" ? "venda" : deal.stage === "perdido" ? "recusa" : "andamento";
      const dealReason = getRefusalReason(deal);
      const dealChannel = deal.tags.includes("Presencial") ? "presencial" : deal.tags.includes("Instagram") ? "instagram" : "wpp1";
      const matchesPeriod = period === "custom"
        ? interactionTime >= startDate && interactionTime <= endDate
        : interactionTime >= cutoff;

      return canViewDeal(deal)
        && matchesPeriod
        && (!isAdmin || seller === "all" || deal.sellerId === seller)
        && (stage === "all" || deal.stage === stage)
        && (temperature === "all" || deal.temperature === temperature)
        && (result === "all" || dealResult === result)
        && (reason === "all" || dealReason === reason)
        && (channel === "all" || dealChannel === channel)
        && (!minValue || (deal.estimatedValue || 0) >= Number(minValue));
    });
  }, [canViewDeal, deals, period, customStart, customEnd, seller, stage, temperature, result, reason, channel, minValue, isAdmin]);

  const reportRows = useMemo(() => {
    if (selected === "vendas") return filteredDeals.filter(deal => deal.stage === "fechado");
    if (selected === "recusas") return filteredDeals.filter(deal => deal.stage === "perdido");
    if (selected === "sem-resposta") return filteredDeals.filter(deal => deal.unread);
    if (selected === "quentes") return filteredDeals.filter(deal => deal.temperature === "quente");
    return filteredDeals;
  }, [filteredDeals, selected]);

  const totalValue = reportRows.reduce((sum, deal) => sum + (deal.estimatedValue || 0), 0);
  const closedCount = reportRows.filter(deal => deal.stage === "fechado").length;
  const conversion = reportRows.length ? ((closedCount / reportRows.length) * 100).toFixed(1) : "0.0";
  const avgTicket = closedCount ? totalValue / closedCount : 0;

  const visibleSellers = isAdmin ? SELLERS : SELLERS.filter(sellerItem => sellerItem.id === currentUser?.id);
  const sellerPerformance = visibleSellers.map(s => {
    const sellerDeals = filteredDeals.filter(deal => deal.sellerId === s.id);
    const sellerClosed = sellerDeals.filter(deal => deal.stage === "fechado").length;
    return {
      ...s,
      atendimentos: sellerDeals.length,
      vendas: sellerClosed,
      conversao: sellerDeals.length ? ((sellerClosed / sellerDeals.length) * 100).toFixed(1) : "0.0",
      valor: sellerDeals.reduce((sum, deal) => sum + (deal.estimatedValue || 0), 0),
    };
  });

  const agentPerformance = agents.map((agent, index) => ({
    name: agent.name,
    channel: agent.channel,
    conversations: agent.conversations,
    resolution: `${82 - index * 6}%`,
    handoff: `${12 + index * 4}%`,
    active: agent.active,
  }));
  const mostCommonReason = REFUSAL_PIE.sort((a, b) => b.value - a.value)[0]?.name || "preço";
  const insights = [
    `${sellerPerformance.sort((a, b) => Number(b.conversao) - Number(a.conversao))[0]?.name || "Ana"} teve a melhor conversão do período.`,
    `O motivo de perda mais comum foi ${mostCommonReason.toLowerCase()}.`,
    "Leads quentes parados há mais de 24h aparecem com menor taxa de conversão.",
    "O período da tarde concentrou maior volume de atendimentos.",
    "Campanhas de reativação tiveram maior taxa de resposta que disparos frios.",
  ];

  const exportFile = (type: "xlsx" | "csv") => {
    if (!hasPermission("Exportar dados")) {
      toast.error("Seu usuário não tem permissão para exportar dados");
      return;
    }
    if (type === "xlsx") {
      const lineSeries = MONTHLY_SERIES.slice(-(daysByPeriod[period] ?? 30));
      const tableRows = reportRows.map(deal => {
        const sellerName = SELLERS.find(s => s.id === deal.sellerId)?.name || "";
        const stageName = stages.find(s => s.id === deal.stage)?.title || "";
        return `
          <tr>
            <td>${escapeHtml(format(new Date(deal.lastInteraction), "dd/MM/yyyy HH:mm"))}</td>
            <td>${escapeHtml(deal.customer)}</td>
            <td>${escapeHtml(deal.phone)}</td>
            <td>${escapeHtml(sellerName)}</td>
            <td>${escapeHtml(stageName)}</td>
            <td>${escapeHtml(deal.temperature)}</td>
            <td style="mso-number-format:'R$ #,##0.00';">${deal.estimatedValue || 0}</td>
            <td>${escapeHtml(deal.tags.join(", "))}</td>
          </tr>
        `;
      }).join("");
      const lineDataRows = lineSeries.map(item => `
        <tr>
          <td>${escapeHtml(item.day)}</td>
          <td>${item.atendimentos}</td>
          <td>${item.vendas}</td>
        </tr>
      `).join("");
      const refusalRows = REFUSAL_PIE.map(item => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${item.value}</td>
        </tr>
      `).join("");
      const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
          <head>
            <meta charset="UTF-8" />
            <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Relatorio CRM</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
            <style>
              body { font-family: Arial, sans-serif; color: #0f172a; }
              h1 { font-size: 22px; margin: 0 0 4px; }
              h2 { font-size: 16px; margin: 22px 0 8px; color: #1e293b; }
              .muted { color: #64748b; font-size: 12px; }
              .summary td { border: 1px solid #cbd5e1; padding: 10px 14px; background: #f8fafc; }
              .summary .value { font-size: 20px; font-weight: 700; color: #2563eb; }
              table { border-collapse: collapse; }
              th { background: #1e293b; color: #ffffff; font-weight: 700; padding: 8px; border: 1px solid #334155; }
              td { padding: 7px; border: 1px solid #cbd5e1; vertical-align: top; }
              .data tr:nth-child(even) td { background: #f8fafc; }
              .chart-cell { border: 1px solid #cbd5e1; padding: 12px; background: #ffffff; }
            </style>
          </head>
          <body>
            <h1>Relatório CRM WhatsApp</h1>
            <div class="muted">Gerado em ${escapeHtml(format(new Date(), "dd/MM/yyyy HH:mm"))} · Relatório: ${escapeHtml(REPORTS.find(report => report.id === selected)?.name)}</div>

            <h2>Resumo executivo</h2>
            <table class="summary">
              <tr>
                <td><div class="muted">Resultados</div><div class="value">${reportRows.length}</div></td>
                <td><div class="muted">Valor em carteira</div><div class="value">R$ ${Math.round(totalValue).toLocaleString("pt-BR")}</div></td>
                <td><div class="muted">Conversão</div><div class="value">${conversion}%</div></td>
                <td><div class="muted">Ticket médio</div><div class="value">R$ ${Math.round(avgTicket).toLocaleString("pt-BR")}</div></td>
              </tr>
            </table>

            <h2>Dashboard</h2>
            <table>
              <tr>
                <td class="chart-cell">${buildLineChartSvg(lineSeries)}</td>
                <td class="chart-cell">${buildPieChartSvg(REFUSAL_PIE)}</td>
              </tr>
            </table>

            <h2>Dados do gráfico - Atendimentos por dia</h2>
            <table class="data">
              <tr><th>Dia</th><th>Atendimentos</th><th>Vendas</th></tr>
              ${lineDataRows}
            </table>

            <h2>Dados do gráfico - Motivos de recusa</h2>
            <table class="data">
              <tr><th>Motivo</th><th>Participação</th></tr>
              ${refusalRows}
            </table>

            <h2>Registros exportados</h2>
            <table class="data">
              <tr>
                <th>Data</th><th>Cliente</th><th>WhatsApp</th><th>Vendedora</th>
                <th>Status</th><th>Temperatura</th><th>Valor</th><th>Tags</th>
              </tr>
              ${tableRows || `<tr><td colspan="8">Nenhum registro encontrado.</td></tr>`}
            </table>
          </body>
        </html>
      `;
      const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-dashboard-${selected}.xls`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Relatório Excel exportado com dashboard");
      return;
    }
    const header = ["data", "cliente", "telefone", "vendedora", "status", "temperatura", "valor", "tags"];
    const lines = reportRows.map(deal => {
      const sellerName = SELLERS.find(s => s.id === deal.sellerId)?.name || "";
      const stageName = stages.find(s => s.id === deal.stage)?.title || "";
      return [
        format(new Date(deal.lastInteraction), "dd/MM/yyyy HH:mm"),
        deal.customer,
        deal.phone,
        sellerName,
        stageName,
        deal.temperature,
        deal.estimatedValue || 0,
        deal.tags.join("|"),
      ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(",");
    });
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-${selected}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório CSV exportado");
  };

  if (!hasPermission("Ver relatórios")) {
    return (
      <AppLayout title="Relatórios" subtitle="Acesso restrito">
        <div className="card-elevated p-6 text-sm text-muted-foreground">
          Seu usuário não tem permissão para visualizar relatórios.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Relatórios" subtitle="Filtre e exporte os dados que precisar">
      <div className="card-elevated p-5 mb-5">
        <h3 className="font-semibold text-sm mb-3">Filtros</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div><Label className="text-xs">Período</Label><Select value={period} onValueChange={setPeriod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="today">Hoje</SelectItem><SelectItem value="7d">7 dias</SelectItem><SelectItem value="30d">30 dias</SelectItem><SelectItem value="90d">90 dias</SelectItem><SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent></Select></div>
          {period === "custom" && (
            <>
              <div><Label className="text-xs">Início</Label><Input type="date" value={customStart} onChange={event => setCustomStart(event.target.value)} /></div>
              <div><Label className="text-xs">Fim</Label><Input type="date" value={customEnd} onChange={event => setCustomEnd(event.target.value)} /></div>
            </>
          )}
          {isAdmin && <div><Label className="text-xs">Vendedora</Label><Select value={seller} onValueChange={setSeller}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all">Todas</SelectItem>{SELLERS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent></Select></div>}
          <div><Label className="text-xs">Status</Label><Select value={stage} onValueChange={setStage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all">Todos</SelectItem>{stages.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
          </SelectContent></Select></div>
          <div><Label className="text-xs">Temperatura</Label><Select value={temperature} onValueChange={setTemperature}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all">Todas</SelectItem><SelectItem value="quente">Quente</SelectItem><SelectItem value="morno">Morno</SelectItem><SelectItem value="frio">Frio</SelectItem>
          </SelectContent></Select></div>
          <div><Label className="text-xs">Resultado</Label><Select value={result} onValueChange={setResult}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all">Todos</SelectItem><SelectItem value="venda">Venda</SelectItem><SelectItem value="recusa">Recusa</SelectItem>
          </SelectContent></Select></div>
          <div><Label className="text-xs">Motivo recusa</Label><Select value={reason} onValueChange={setReason}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all">Todos</SelectItem>{REFUSAL_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent></Select></div>
          <div><Label className="text-xs">Canal</Label><Select value={channel} onValueChange={setChannel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all">Todos</SelectItem><SelectItem value="wpp1">WhatsApp Principal</SelectItem><SelectItem value="instagram">Instagram</SelectItem><SelectItem value="presencial">Presencial</SelectItem>
          </SelectContent></Select></div>
          <div><Label className="text-xs">Valor mínimo</Label><Input type="number" placeholder="R$ 0" value={minValue} onChange={event => setMinValue(event.target.value)} /></div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">Resultados</div><div className="text-2xl font-bold">{reportRows.length}</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">Valor em carteira</div><div className="text-2xl font-bold">R$ {Math.round(totalValue).toLocaleString("pt-BR")}</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">Conversão</div><div className="text-2xl font-bold">{conversion}%</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">Ticket médio</div><div className="text-2xl font-bold">R$ {Math.round(avgTicket).toLocaleString("pt-BR")}</div></div>
      </div>

      <section className="card-elevated mb-6 p-5">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <h2 className="font-display text-base font-bold">Insights automáticos</h2>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          {insights.map(insight => (
            <div key={insight} className="rounded-xl border border-border/70 bg-background p-3 text-sm text-muted-foreground">
              {insight}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {REPORTS.map(r => (
          <button key={r.id} onClick={() => setSelected(r.id)}
            className={`text-left card-elevated p-4 transition-all hover:shadow-soft ${selected === r.id ? "ring-2 ring-primary border-primary" : ""}`}>
            <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center mb-2"><r.icon className="w-4 h-4" /></div>
            <div className="font-semibold text-sm">{r.name}</div>
            <div className="text-xs text-muted-foreground line-clamp-2">{r.desc}</div>
          </button>
        ))}
      </div>

      <div className="card-elevated p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display font-bold">{REPORTS.find(r => r.id === selected)?.name}</h3>
            <p className="text-xs text-muted-foreground">Preview dos registros filtrados · {reportRows.length} resultados</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => toast.success(`${reportRows.length} registros carregados`)}><Play className="w-4 h-4" /> Gerar</Button>
            <Button variant="outline" className="gap-2" onClick={() => exportFile("csv")}><Download className="w-4 h-4" /> Exportar CSV</Button>
            <Button variant="outline" className="gap-2" onClick={() => toast.success("Relatório pronto para compartilhar")}><Share2 className="w-4 h-4" /> Compartilhar relatório</Button>
            <Button className="gap-2 bg-success hover:bg-success/90" onClick={() => exportFile("xlsx")}><FileSpreadsheet className="w-4 h-4" /> Exportar PDF</Button>
          </div>
        </div>

        {selected === "vendedoras" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            {sellerPerformance.map(s => (
              <div key={s.id} className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.atendimentos} atendimentos · {s.vendas} vendas</div>
                <div className="text-sm font-bold mt-3">{s.conversao}% conversão</div>
                <div className="text-xs text-success mt-1">R$ {s.valor.toLocaleString("pt-BR")}</div>
              </div>
            ))}
          </div>
        ) : selected === "agentes" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {agentPerformance.map(agent => (
              <div key={agent.name} className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="font-semibold">{agent.name}</div>
                <div className="text-xs text-muted-foreground">{agent.channel}</div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div><div className="font-bold text-base">{agent.conversations}</div><div className="text-muted-foreground">Conversas</div></div>
                  <div><div className="font-bold text-base">{agent.resolution}</div><div className="text-muted-foreground">Resolve</div></div>
                  <div><div className="font-bold text-base">{agent.handoff}</div><div className="text-muted-foreground">Humano</div></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-muted-foreground border-b">
                <th className="py-2.5 font-semibold pr-3">Data</th><th className="py-2.5 font-semibold pr-3">Cliente</th>
                <th className="py-2.5 font-semibold pr-3">WhatsApp</th><th className="py-2.5 font-semibold pr-3">Vendedora</th>
                <th className="py-2.5 font-semibold pr-3">Status</th><th className="py-2.5 font-semibold pr-3">Temperatura</th>
                <th className="py-2.5 font-semibold pr-3">Valor</th><th className="py-2.5 font-semibold pr-3">Tags</th>
              </tr></thead>
              <tbody>
                {reportRows.map(d => {
                  const sellerName = SELLERS.find(s => s.id === d.sellerId)?.name;
                  const stageName = stages.find(s => s.id === d.stage)?.title;
                  return (
                    <tr key={d.id} className="border-b border-border/40 hover:bg-secondary/40">
                      <td className="py-3 pr-3 text-muted-foreground text-xs">{format(new Date(d.lastInteraction), "dd/MM/yy HH:mm")}</td>
                      <td className="py-3 pr-3 font-medium truncate max-w-[160px]">{d.customer}</td>
                      <td className="py-3 pr-3 text-muted-foreground text-xs">{d.phone}</td>
                      <td className="py-3 pr-3">{sellerName}</td>
                      <td className="py-3 pr-3 text-xs">{stageName}</td>
                      <td className="py-3 pr-3"><ClientTemperatureBadge temp={d.temperature} /></td>
                      <td className="py-3 pr-3 font-semibold">{d.estimatedValue ? `R$ ${d.estimatedValue.toLocaleString("pt-BR")}` : "-"}</td>
                      <td className="py-3 pr-3"><div className="flex gap-1 flex-wrap">{d.tags.slice(0, 2).map(t => <TagBadge key={t} label={t} />)}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {reportRows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">Nenhum registro encontrado para os filtros atuais.</div>}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
