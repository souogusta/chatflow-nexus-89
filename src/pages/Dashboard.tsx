import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { ClientTemperatureBadge } from "@/components/shared/Badges";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCRM } from "@/store/crm-store";
import { SELLERS, MONTHLY_SERIES, REFUSAL_PIE, SELLER_RANKING } from "@/lib/mock-data";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Area, AreaChart } from "recharts";
import { MessageCircle, Clock, AlertTriangle, ShoppingBag, TrendingUp, Flame, Thermometer, Snowflake, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PERIODS = [
  { id: "today", label: "Hoje", days: 1 },
  { id: "7d", label: "7 dias", days: 7 },
  { id: "30d", label: "30 dias", days: 30 },
  { id: "custom", label: "Personalizado", days: 30 },
];

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--warning))", "hsl(var(--hot))", "hsl(var(--success))", "hsl(var(--muted-foreground))"];

export default function Dashboard() {
  const [period, setPeriod] = useState("7d");
  const [seller, setSeller] = useState("all");
  const { deals } = useCRM();
  const navigate = useNavigate();

  const days = PERIODS.find(p => p.id === period)?.days ?? 7;
  const series = useMemo(() => MONTHLY_SERIES.slice(-days), [days]);

  const tempCounts = useMemo(() => ({
    quente: deals.filter(d => d.temperature === "quente").length,
    morno: deals.filter(d => d.temperature === "morno").length,
    frio: deals.filter(d => d.temperature === "frio").length,
  }), [deals]);

  const critical = deals
    .filter(d => d.unread || d.temperature === "quente")
    .sort((a, b) => +new Date(a.lastInteraction) - +new Date(b.lastInteraction))
    .slice(0, 5);

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do seu atendimento comercial">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={seller} onValueChange={setSeller}>
          <SelectTrigger className="w-[200px] bg-card rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas vendedoras</SelectItem>
            {SELLERS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 bg-card rounded-xl p-1 border border-border/60">
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${period === p.id ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<MessageCircle className="w-5 h-5" />} label="Total de atendimentos" value="1.284" delta="12.4%" accent="primary" />
        <MetricCard icon={<Clock className="w-5 h-5" />} label="Tempo médio de resposta" value="2m 18s" delta="8.1%" deltaPositive accent="info" />
        <MetricCard icon={<AlertTriangle className="w-5 h-5" />} label="Sem resposta" value="23" delta="4.2%" deltaPositive={false} accent="destructive" />
        <MetricCard icon={<ShoppingBag className="w-5 h-5" />} label="Vendas realizadas" value="R$ 184.5K" delta="18.7%" accent="success" />
        <MetricCard icon={<TrendingUp className="w-5 h-5" />} label="Taxa de conversão" value="24.8%" delta="3.2%" accent="primary" />
        <MetricCard icon={<Flame className="w-5 h-5" />} label="Clientes quentes" value={String(tempCounts.quente)} delta="11.0%" accent="destructive" />
        <MetricCard icon={<Thermometer className="w-5 h-5" />} label="Clientes mornos" value={String(tempCounts.morno)} delta="2.4%" accent="warning" />
        <MetricCard icon={<Snowflake className="w-5 h-5" />} label="Clientes frios" value={String(tempCounts.frio)} delta="6.0%" deltaPositive={false} accent="info" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card-elevated p-6 lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-base">Atendimentos por dia</h3>
              <p className="text-xs text-muted-foreground">Evolução nos últimos {days} dias</p>
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
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
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
              <Pie data={REFUSAL_PIE} dataKey="value" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {REFUSAL_PIE.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {REFUSAL_PIE.map((r, i) => (
              <div key={r.name} className="flex items-center gap-1.5 text-[11px]">
                <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-muted-foreground truncate">{r.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ranking + critical */}
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
                {SELLER_RANKING.map((s, i) => (
                  <tr key={s.id} className="border-b border-border/40 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="text-xs font-bold text-muted-foreground w-4">{i + 1}º</div>
                        <Avatar className="w-8 h-8"><AvatarFallback className="bg-primary-soft text-primary text-xs font-semibold">{s.avatar}</AvatarFallback></Avatar>
                        <span className="font-semibold">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 font-semibold">{s.atendimentos}</td>
                    <td className="py-3 font-semibold text-success">{s.vendas}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-primary" style={{ width: `${s.conversao * 3}%` }} />
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
            {critical.map(d => (
              <div key={d.id} className="p-3 rounded-xl bg-secondary/60 border border-border/40 hover:bg-secondary transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="font-semibold text-sm truncate">{d.customer}</div>
                  <ClientTemperatureBadge temp={d.temperature} />
                </div>
                <p className="text-xs text-muted-foreground truncate mb-2">{d.lastMessage}</p>
                <Button size="sm" variant="ghost" className="h-7 text-xs px-2 -ml-2 text-primary hover:text-primary"
                  onClick={() => navigate("/conversas")}>
                  Abrir conversa <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
