import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCRM } from "@/store/crm-store";
import { SELLERS, STAGES, REFUSAL_REASONS } from "@/lib/mock-data";
import { ClientTemperatureBadge, TagBadge } from "@/components/shared/Badges";
import { Download, FileSpreadsheet, Play, FileText, Users, Bot, Flame, AlertTriangle, History, ShoppingBag, X } from "lucide-react";
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

export default function Relatorios() {
  const { deals } = useCRM();
  const [selected, setSelected] = useState("atendimentos");

  const exportFile = (type: "xlsx" | "csv") => {
    toast.success(`Relatório exportado com sucesso (.${type})`);
  };

  return (
    <AppLayout title="Relatórios" subtitle="Filtre e exporte os dados que precisar">
      {/* Filters */}
      <div className="card-elevated p-5 mb-5">
        <h3 className="font-semibold text-sm mb-3">Filtros</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div><Label className="text-xs">Período</Label><Select defaultValue="30d"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="7d">7 dias</SelectItem><SelectItem value="30d">30 dias</SelectItem><SelectItem value="90d">90 dias</SelectItem>
          </SelectContent></Select></div>
          <div><Label className="text-xs">Vendedora</Label><Select defaultValue="all"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all">Todas</SelectItem>{SELLERS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent></Select></div>
          <div><Label className="text-xs">Status</Label><Select defaultValue="all"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all">Todos</SelectItem>{STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
          </SelectContent></Select></div>
          <div><Label className="text-xs">Temperatura</Label><Select defaultValue="all"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all">Todas</SelectItem><SelectItem value="quente">Quente</SelectItem><SelectItem value="morno">Morno</SelectItem><SelectItem value="frio">Frio</SelectItem>
          </SelectContent></Select></div>
          <div><Label className="text-xs">Resultado</Label><Select defaultValue="all"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all">Todos</SelectItem><SelectItem value="venda">Venda</SelectItem><SelectItem value="recusa">Recusa</SelectItem>
          </SelectContent></Select></div>
          <div><Label className="text-xs">Motivo recusa</Label><Select defaultValue="all"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all">Todos</SelectItem>{REFUSAL_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent></Select></div>
          <div><Label className="text-xs">Canal</Label><Select defaultValue="all"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all">Todos</SelectItem><SelectItem value="wpp1">WhatsApp Principal</SelectItem><SelectItem value="wpp2">WhatsApp Suporte</SelectItem>
          </SelectContent></Select></div>
          <div><Label className="text-xs">Valor mínimo</Label><Input type="number" placeholder="R$ 0" /></div>
        </div>
      </div>

      {/* Report cards */}
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

      {/* Actions + preview */}
      <div className="card-elevated p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display font-bold">{REPORTS.find(r => r.id === selected)?.name}</h3>
            <p className="text-xs text-muted-foreground">Preview dos primeiros registros · {deals.length} resultados</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => toast.success("Relatório gerado")}><Play className="w-4 h-4" /> Gerar</Button>
            <Button variant="outline" className="gap-2" onClick={() => exportFile("csv")}><Download className="w-4 h-4" /> CSV</Button>
            <Button className="gap-2 bg-success hover:bg-success/90" onClick={() => exportFile("xlsx")}><FileSpreadsheet className="w-4 h-4" /> Excel</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-muted-foreground border-b">
              <th className="py-2.5 font-semibold pr-3">Data</th><th className="py-2.5 font-semibold pr-3">Cliente</th>
              <th className="py-2.5 font-semibold pr-3">WhatsApp</th><th className="py-2.5 font-semibold pr-3">Vendedora</th>
              <th className="py-2.5 font-semibold pr-3">Status</th><th className="py-2.5 font-semibold pr-3">Temperatura</th>
              <th className="py-2.5 font-semibold pr-3">Valor</th><th className="py-2.5 font-semibold pr-3">Tags</th>
            </tr></thead>
            <tbody>
              {deals.map(d => {
                const seller = SELLERS.find(s => s.id === d.sellerId);
                const stage = STAGES.find(s => s.id === d.stage);
                return (
                  <tr key={d.id} className="border-b border-border/40 hover:bg-secondary/40">
                    <td className="py-3 pr-3 text-muted-foreground text-xs">{format(new Date(d.lastInteraction), "dd/MM/yy HH:mm")}</td>
                    <td className="py-3 pr-3 font-medium truncate max-w-[160px]">{d.customer}</td>
                    <td className="py-3 pr-3 text-muted-foreground text-xs">{d.phone}</td>
                    <td className="py-3 pr-3">{seller?.name}</td>
                    <td className="py-3 pr-3 text-xs">{stage?.title}</td>
                    <td className="py-3 pr-3"><ClientTemperatureBadge temp={d.temperature} /></td>
                    <td className="py-3 pr-3 font-semibold">{d.estimatedValue ? `R$ ${d.estimatedValue.toLocaleString("pt-BR")}` : "—"}</td>
                    <td className="py-3 pr-3"><div className="flex gap-1 flex-wrap">{d.tags.slice(0, 2).map(t => <TagBadge key={t} label={t} />)}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
