import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { ClientTemperatureBadge } from "@/components/shared/Badges";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCRM } from "@/store/crm-store";
import { SELLERS, MONTHLY_SERIES, REFUSAL_PIE, SELLER_RANKING } from "@/lib/mock-data";
import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Area, AreaChart } from "recharts";
import { MessageCircle, Clock, AlertTriangle, ShoppingBag, TrendingUp, Flame, Thermometer, Snowflake, ChevronDown, ChevronRight } from "lucide-react";

const PERIODS = [
  { id: "today", label: "Hoje", days: 1 },
  { id: "7d", label: "7 dias", days: 7 },
  { id: "30d", label: "30 dias", days: 30 },
  { id: "custom", label: "Personalizado", days: 30 },
];

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--warning))", "hsl(var(--hot))", "hsl(var(--success))", "hsl(var(--muted-foreground))"];
const sellerMultipliers: Record<string, number> = { all: 1, s1: 1.16, s2: 1.04, s3: 0.78, s4: 0.92, s5: 0.86 };
const SELLER_IDS = SELLERS.map(s => s.id);
const refusalReasonParams: Record<string, string> = {
  "Preço alto": "Preço alto",
  "Sem orçamento": "Cliente sem orçamento",
  "Comprou com concorrente": "Comprou com concorrente",
  "Não respondeu mais": "Não respondeu mais",
  "Apenas pesquisando": "Está apenas pesquisando",
  "Outros": "Outros",
};
const formatBRL = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
const formatSignedInteger = (value: number) => `${value >= 0 ? "+" : ""}${Math.round(value)}`;
const formatSignedBRL = (value: number) => `${value >= 0 ? "+" : "-"}${formatBRL(Math.abs(value))}`;

function buildMetricDelta(current: number, previous: number, valueFormatter = formatSignedInteger) {
  const difference = current - previous;
  const percent = previous ? (difference / previous) * 100 : current ? 100 : 0;
  return {
    percent: `${Math.abs(percent).toFixed(1)}%`,
    value: valueFormatter(difference),
    positive: difference >= 0,
  };
}

function buildHourlySeries(multiplier: number) {
  const dayBase = MONTHLY_SERIES[MONTHLY_SERIES.length - 1];
  return Array.from({ length: 24 }, (_, hour) => {
    const activity = 0.45 + Math.sin((hour - 7) / 24 * Math.PI) * 0.35 + (hour >= 8 && hour <= 18 ? 0.35 : 0);
    const atendimentos = Math.max(0, Math.round((dayBase.atendimentos / 13) * activity * multiplier));
    const vendas = Math.max(0, Math.round((dayBase.vendas / 16) * activity * multiplier));

    return {
      label: `${String(hour).padStart(2, "0")}h`,
      atendimentos,
      vendas,
    };
  });
}

function formatTimeWithoutResponse(lastInteraction: string) {
  const lastInteractionTime = new Date(lastInteraction).getTime();
  if (Number.isNaN(lastInteractionTime)) return "Sem registro";

  const totalMinutes = Math.max(0, Math.floor((Date.now() - lastInteractionTime) / 60000));
  if (totalMinutes < 1) return "Agora";
  if (totalMinutes < 60) return `${totalMinutes}min`;

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (totalHours < 24) {
    return remainingMinutes ? `${totalHours}h ${remainingMinutes}min` : `${totalHours}h`;
  }

  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
}

function daysBetween(start: string, end: string) {
  if (!start || !end) return 30;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const diff = Math.floor((+endDate - +startDate) / 86400000) + 1;
  return Math.min(Math.max(diff, 1), 30);
}

export default function Dashboard() {
  const [period, setPeriod] = useState("7d");
  const [selectedSellerIds, setSelectedSellerIds] = useState<string[]>(SELLER_IDS);
  const [customStart, setCustomStart] = useState("2026-04-01");
  const [customEnd, setCustomEnd] = useState("2026-04-28");
  const { deals, canViewDeal, currentUser, isAdmin } = useCRM();
  const navigate = useNavigate();

  const days = period === "custom"
    ? daysBetween(customStart, customEnd)
    : PERIODS.find(p => p.id === period)?.days ?? 7;
  const effectiveSellerIds = useMemo(
    () => (isAdmin ? selectedSellerIds : currentUser?.id ? [currentUser.id] : []),
    [currentUser?.id, isAdmin, selectedSellerIds],
  );
  const allSellersSelected = isAdmin && effectiveSellerIds.length === SELLER_IDS.length;
  const sellerParam = allSellersSelected ? "all" : effectiveSellerIds.join(",");
  const multiplier = allSellersSelected
    ? 1
    : effectiveSellerIds.reduce((sum, id) => sum + (sellerMultipliers[id] ?? 1), 0) / Math.max(effectiveSellerIds.length, 1);
  const sellerFilterLabel = allSellersSelected
    ? "Todas vendedoras"
    : effectiveSellerIds.length === 1
      ? SELLERS.find(s => s.id === effectiveSellerIds[0])?.name ?? currentUser?.name ?? "1 vendedora"
      : `${effectiveSellerIds.length} vendedoras`;
  const filteredDeals = useMemo(
    () => deals.filter(deal => canViewDeal(deal) && (allSellersSelected || effectiveSellerIds.includes(deal.sellerId))),
    [allSellersSelected, canViewDeal, deals, effectiveSellerIds]
  );

  const series = useMemo(() => (
    period === "today"
      ? buildHourlySeries(multiplier)
      : MONTHLY_SERIES.slice(-days).map((item) => ({
      label: item.day,
      atendimentos: Math.max(1, Math.round(item.atendimentos * multiplier)),
      vendas: Math.max(0, Math.round(item.vendas * multiplier * 0.96)),
    }))
  ), [days, multiplier, period]);

  const previousSeries = useMemo(() => {
    if (period === "today") {
      return buildHourlySeries(multiplier * 0.88);
    }

    const previousWindow = MONTHLY_SERIES.slice(-(days * 2), -days);
    const source = previousWindow.length === days
      ? previousWindow
      : MONTHLY_SERIES.slice(-days).map(item => ({
        ...item,
        atendimentos: Math.round(item.atendimentos * 0.9),
        vendas: Math.round(item.vendas * 0.84),
      }));

    return source.map((item) => ({
      label: item.day,
      atendimentos: Math.max(1, Math.round(item.atendimentos * multiplier)),
      vendas: Math.max(0, Math.round(item.vendas * multiplier * 0.96)),
    }));
  }, [days, multiplier, period]);

  const tempCounts = useMemo(() => ({
    quente: filteredDeals.filter(d => d.temperature === "quente").length,
    morno: filteredDeals.filter(d => d.temperature === "morno").length,
    frio: filteredDeals.filter(d => d.temperature === "frio").length,
  }), [filteredDeals]);

  const totalAtendimentos = series.reduce((sum, item) => sum + item.atendimentos, 0);
  const totalVendas = series.reduce((sum, item) => sum + item.vendas, 0);
  const previousAtendimentos = previousSeries.reduce((sum, item) => sum + item.atendimentos, 0);
  const previousVendas = previousSeries.reduce((sum, item) => sum + item.vendas, 0);
  const revenue = filteredDeals.reduce((sum, item) => sum + (item.estimatedValue || 0), 0) * multiplier;
  const previousRevenue = revenue * 0.86;
  const conversion = totalAtendimentos ? ((totalVendas / totalAtendimentos) * 100).toFixed(1) : "0.0";
  const previousConversion = previousAtendimentos ? (previousVendas / previousAtendimentos) * 100 : 0;
  const unread = filteredDeals.filter(d => d.unread).length;
  const previousUnread = Math.max(0, unread - Math.max(1, Math.round(days / 14)));
  const previousTempCounts = {
    quente: Math.max(0, tempCounts.quente - Math.max(1, Math.round(days / 10))),
    morno: Math.max(0, tempCounts.morno - (period === "30d" ? 4 : Math.max(1, Math.round(days / 7)))),
    frio: tempCounts.frio + Math.max(1, Math.round(days / 20)),
  };
  const metricDeltas = {
    atendimentos: buildMetricDelta(totalAtendimentos, previousAtendimentos),
    resposta: buildMetricDelta(Math.max(1, Math.round(198 / multiplier)), Math.max(1, Math.round(224 / multiplier)), value => `${formatSignedInteger(value)}s`),
    unread: buildMetricDelta(unread, previousUnread),
    revenue: buildMetricDelta(revenue, previousRevenue, formatSignedBRL),
    conversion: buildMetricDelta(Number(conversion), previousConversion, value => `${value >= 0 ? "+" : ""}${value.toFixed(1)}pp`),
    quente: buildMetricDelta(tempCounts.quente, previousTempCounts.quente),
    morno: buildMetricDelta(tempCounts.morno, previousTempCounts.morno),
    frio: buildMetricDelta(tempCounts.frio, previousTempCounts.frio),
  };

  const ranking = useMemo(() => (
    allSellersSelected ? SELLER_RANKING : SELLER_RANKING.filter(s => effectiveSellerIds.includes(s.id))
  ), [allSellersSelected, effectiveSellerIds]);

  const critical = filteredDeals
    .filter(d => d.temperature === "quente")
    .sort((a, b) => +new Date(a.lastInteraction) - +new Date(b.lastInteraction))
    .slice(0, 5);
  const refusalChartData = useMemo(() => (
    REFUSAL_PIE.map(r => ({
      ...r,
      reason: refusalReasonParams[r.name] || r.name,
      value: Math.round(r.value * multiplier),
    }))
  ), [multiplier]);

  const openRefusalReport = (reason: string) => {
    const params = new URLSearchParams({
      report: "atendimentos",
      period,
      seller: sellerParam,
      reason,
    });
    if (period === "custom") {
      params.set("start", customStart);
      params.set("end", customEnd);
    }
    navigate(`/relatorios?${params.toString()}`);
  };

  const toggleSeller = (sellerId: string) => {
    setSelectedSellerIds(current => {
      const next = current.includes(sellerId)
        ? current.filter(id => id !== sellerId)
        : [...current, sellerId];

      return next.length ? next : current;
    });
  };

  const toggleAllSellers = () => {
    setSelectedSellerIds(current => current.length === SELLER_IDS.length ? [SELLER_IDS[0]] : SELLER_IDS);
  };

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do seu atendimento comercial">
      <div className="flex flex-wrap items-end gap-3 mb-6">
        {isAdmin && <div>
          <Label className="text-xs text-muted-foreground">Atendente</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[220px] justify-between bg-card rounded-xl font-normal">
                <span className="truncate">{sellerFilterLabel}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[240px] p-2">
              <label className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-secondary">
                <Checkbox checked={allSellersSelected} onCheckedChange={toggleAllSellers} aria-label="Selecionar todas vendedoras" />
                <span>Todas vendedoras</span>
              </label>
              <div className="my-1 h-px bg-border" />
              {SELLERS.map(s => (
                <label key={s.id} className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-secondary">
                  <Checkbox checked={selectedSellerIds.includes(s.id)} onCheckedChange={() => toggleSeller(s.id)} aria-label={`Selecionar ${s.name}`} />
                  <span>{s.name}</span>
                </label>
              ))}
            </PopoverContent>
          </Popover>
        </div>}

        <div className="flex items-center gap-1 bg-card rounded-xl p-1 border border-border/60">
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${period === p.id ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
              {p.label}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <Label htmlFor="start" className="text-xs text-muted-foreground">Início</Label>
              <Input id="start" type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="h-9 bg-card" />
            </div>
            <div>
              <Label htmlFor="end" className="text-xs text-muted-foreground">Fim</Label>
              <Input id="end" type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="h-9 bg-card" />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard onClick={() => navigate("/conversas")} icon={<MessageCircle className="w-5 h-5" />} label="Total de atendimentos" value={String(totalAtendimentos)} delta={metricDeltas.atendimentos.percent} deltaValue={metricDeltas.atendimentos.value} deltaPositive={metricDeltas.atendimentos.positive} accent="primary" />
        <MetricCard onClick={() => navigate("/relatorios?report=vendedoras")} icon={<Clock className="w-5 h-5" />} label="Tempo médio de resposta" value={`${Math.max(1, Math.round(3 / multiplier))}m ${Math.round(18 / multiplier)}s`} delta={metricDeltas.resposta.percent} deltaValue={metricDeltas.resposta.value} deltaPositive={!metricDeltas.resposta.positive} accent="info" />
        <MetricCard onClick={() => navigate("/conversas?status=sem-resposta")} icon={<AlertTriangle className="w-5 h-5" />} label="Conversas sem resposta" value={String(unread)} delta={metricDeltas.unread.percent} deltaValue={metricDeltas.unread.value} deltaPositive={false} accent="destructive" />
        <MetricCard onClick={() => navigate("/relatorios?report=vendas&result=venda")} icon={<ShoppingBag className="w-5 h-5" />} label="Vendas realizadas" value={formatBRL(revenue)} delta={metricDeltas.revenue.percent} deltaValue={metricDeltas.revenue.value} deltaPositive={metricDeltas.revenue.positive} accent="success" />
        <MetricCard onClick={() => navigate("/relatorios?report=kanban")} icon={<TrendingUp className="w-5 h-5" />} label="Taxa de conversão" value={`${conversion}%`} delta={metricDeltas.conversion.percent} deltaValue={metricDeltas.conversion.value} deltaPositive={metricDeltas.conversion.positive} accent="primary" />
        <MetricCard onClick={() => navigate("/kanban?temp=quente")} icon={<Flame className="w-5 h-5" />} label="Clientes quentes" value={String(tempCounts.quente)} delta={metricDeltas.quente.percent} deltaValue={metricDeltas.quente.value} deltaPositive={metricDeltas.quente.positive} accent="destructive" />
        <MetricCard onClick={() => navigate("/kanban?temp=morno")} icon={<Thermometer className="w-5 h-5" />} label="Clientes mornos" value={String(tempCounts.morno)} delta={metricDeltas.morno.percent} deltaValue={metricDeltas.morno.value} deltaPositive={metricDeltas.morno.positive} accent="warning" />
        <MetricCard onClick={() => navigate("/kanban?temp=frio")} icon={<Snowflake className="w-5 h-5" />} label="Clientes frios" value={String(tempCounts.frio)} delta={metricDeltas.frio.percent} deltaValue={metricDeltas.frio.value} deltaPositive={false} accent="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card-elevated p-6 lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-base">Atendimentos por {period === "today" ? "hora" : "dia"}</h3>
              <p className="text-xs text-muted-foreground">{period === "today" ? "Evolução de hoje, hora em hora" : `Evolução nos últimos ${days} dias`}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={series}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Area type="monotone" dataKey="atendimentos" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#g1)" />
              <Line type="monotone" dataKey="vendas" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elevated p-6">
          <h3 className="font-display font-bold text-base">Motivos de recusa</h3>
          <p className="text-xs text-muted-foreground mb-2">Por que perdemos vendas</p>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={refusalChartData}
                dataKey="value"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
                cursor="pointer"
                onClick={(entry) => openRefusalReport(entry.reason)}
              >
                {REFUSAL_PIE.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {refusalChartData.map((r, i) => (
              <button
                key={r.name}
                type="button"
                className="flex items-center gap-1.5 rounded-md text-left text-[11px] transition-colors hover:bg-secondary"
                onClick={() => openRefusalReport(r.reason)}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-muted-foreground truncate">{r.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elevated p-6 lg:col-span-2">
          <h3 className="font-display font-bold text-base mb-4">Ranking de vendedoras</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                  <th className="pb-3 font-semibold">Vendedora</th>
                  <th className="pb-3 font-semibold">Atendimentos</th>
                  <th className="pb-3 font-semibold">Vendas</th>
                  <th className="pb-3 font-semibold">Conversão</th>
                  <th className="pb-3 font-semibold">Tempo médio</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((s, i) => (
                  <tr key={s.id} className="border-b border-border/40 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="text-xs font-bold text-muted-foreground w-4">{i + 1}º</div>
                        <Avatar className="w-8 h-8"><AvatarFallback className="bg-primary-soft text-primary text-xs font-semibold">{s.avatar}</AvatarFallback></Avatar>
                        <span className="font-semibold">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 font-semibold">{Math.round(s.atendimentos * multiplier)}</td>
                    <td className="py-3 font-semibold text-success">{Math.round(s.vendas * multiplier)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-primary" style={{ width: `${Math.min(s.conversao * 3, 100)}%` }} />
                        </div>
                        <span className="text-xs font-semibold">{s.conversao}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground">{s.tempoMedio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-elevated p-6">
          <h3 className="font-display font-bold text-base mb-1">Conversas críticas</h3>
          <p className="text-xs text-muted-foreground mb-4">Aguardando resposta</p>
          <div className="space-y-2.5">
            {critical.map(d => {
              const assignedSeller = SELLERS.find(s => s.id === d.sellerId);
              const waitingTime = formatTimeWithoutResponse(d.lastInteraction);
              return (
                <div key={d.id} className="p-3 rounded-xl bg-secondary/60 border border-border/40 hover:bg-secondary transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{d.customer}</div>
                      <div className="text-[11px] font-semibold text-foreground truncate">Vendedor: {assignedSeller?.name || "Sem responsável"}</div>
                    </div>
                    <ClientTemperatureBadge temp={d.temperature} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-2">{d.lastMessage}</p>
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Sem resposta há {waitingTime}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2 -ml-2 text-primary hover:text-primary"
                    onClick={() => navigate(`/conversas?deal=${d.id}`)}>
                    Abrir conversa <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              );
            })}
            {critical.length === 0 && <div className="text-xs text-muted-foreground py-6 text-center">Nenhuma conversa crítica para este filtro.</div>}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
