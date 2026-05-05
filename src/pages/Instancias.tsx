import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useCRM } from "@/store/crm-store";
import { cn } from "@/lib/utils";
import { Cable, MessageSquare, Power, QrCode, RefreshCcw, Smartphone, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

type InstanceStatus = "ativa" | "desconectada" | "desligada";

type WhatsAppInstance = {
  id: string;
  name: string;
  phone: string;
  status: InstanceStatus;
  lastSync: string;
  conversations: number;
};

const initialInstances: WhatsAppInstance[] = [
  { id: "wa-01", name: "WhatsApp Principal", phone: "+55 11 98888-0101", status: "ativa", lastSync: "2026-04-30T08:42:00", conversations: 38 },
  { id: "wa-02", name: "WhatsApp Comercial 2", phone: "+55 11 97777-0202", status: "desconectada", lastSync: "2026-04-29T17:15:00", conversations: 12 },
  { id: "wa-03", name: "WhatsApp Pos-venda", phone: "+55 11 96666-0303", status: "desligada", lastSync: "2026-04-27T11:20:00", conversations: 0 },
];

const statusConfig: Record<InstanceStatus, { label: string; className: string; icon: typeof Wifi }> = {
  ativa: { label: "Ativa", className: "bg-success-soft text-success", icon: Wifi },
  desconectada: { label: "Desconectada", className: "bg-warning-soft text-warning", icon: WifiOff },
  desligada: { label: "Desligada", className: "bg-muted text-muted-foreground", icon: Power },
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export default function Instancias() {
  const { isAdmin } = useCRM();
  const instances = initialInstances;
  const activeCount = instances.filter(instance => instance.status === "ativa").length;

  const placeholderAction = () => toast.info("Conexao da instancia sera implementada depois");

  if (!isAdmin) {
    return (
      <AppLayout title="Instancias" subtitle="Acesso restrito">
        <div className="card-elevated p-6 text-sm text-muted-foreground">
          Apenas administradores podem gerenciar instancias de WhatsApp.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Instancias" subtitle="Conecte e acompanhe canais de WhatsApp">
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card-elevated p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold">{instances.length}</div>
          <div className="text-xs text-muted-foreground">instancias cadastradas</div>
        </div>
        <div className="card-elevated p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-success-soft text-success">
            <Wifi className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold">{activeCount}</div>
          <div className="text-xs text-muted-foreground">ativas agora</div>
        </div>
        <div className="card-elevated p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-info-soft text-info">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold">{instances.reduce((sum, instance) => sum + instance.conversations, 0)}</div>
          <div className="text-xs text-muted-foreground">conversas vinculadas</div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold">Canais conectados</h2>
          <p className="text-xs text-muted-foreground">Acompanhe status, sincronizacao e volume de conversas de cada instancia.</p>
        </div>
        <Button className="gap-2 bg-gradient-primary" onClick={placeholderAction}>
          <Cable className="h-4 w-4" /> Nova instancia
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {instances.map(instance => {
          const config = statusConfig[instance.status];
          const StatusIcon = config.icon;

          return (
            <div key={instance.id} className="card-elevated p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-bold">{instance.name}</h3>
                    <p className="text-xs text-muted-foreground">{instance.phone}</p>
                  </div>
                </div>
                <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold", config.className)}>
                  <StatusIcon className="h-3 w-3" /> {config.label}
                </span>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-secondary p-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground">Ultima sync</div>
                  <div className="mt-1 text-sm font-medium">{formatDateTime(instance.lastSync)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground">Conversas</div>
                  <div className="mt-1 text-sm font-medium">{instance.conversations}</div>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={placeholderAction}>
                  <QrCode className="h-4 w-4" /> QR Code
                </Button>
                <Button variant="outline" size="icon" title="Atualizar status" onClick={placeholderAction}>
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
