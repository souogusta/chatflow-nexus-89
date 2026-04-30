import { NavLink } from "react-router-dom";
import { LayoutDashboard, Kanban, MessageSquare, CalendarDays, Bot, BarChart3, Settings, Sparkles, Smartphone, Megaphone, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { PermissionKey, useCRM } from "@/store/crm-store";

const items: { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean; permission?: PermissionKey }[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, permission: "Ver dashboard" },
  { to: "/kanban", label: "Kanban", icon: Kanban },
  { to: "/conversas", label: "Conversas", icon: MessageSquare },
  { to: "/calendario", label: "Calendario", icon: CalendarDays },
  { to: "/agentes", label: "Agentes", icon: Bot, permission: "Criar agentes" },
  { to: "/instancias", label: "Instancias", icon: Smartphone, permission: "Alterar configurações da empresa" },
  { to: "/campanhas", label: "Campanha", icon: Megaphone },
  { to: "/disparo-em-massa", label: "Disparo em massa", icon: Send, permission: "Alterar configurações da empresa" },
  { to: "/relatorios", label: "Relatorios", icon: BarChart3, permission: "Ver relatórios" },
  { to: "/configuracoes", label: "Configuracoes", icon: Settings, permission: "Alterar configurações da empresa" },
];

export function Sidebar() {
  const { hasPermission } = useCRM();
  const visibleItems = items.filter(item => !item.permission || hasPermission(item.permission));

  return (
    <aside className="hidden md:flex w-[248px] shrink-0 flex-col bg-gradient-sidebar text-sidebar-foreground p-4 sticky top-0 h-screen">
      <div className="flex items-center gap-2 px-2 py-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="font-display font-bold text-base leading-tight">CRM WhatsApp</div>
          <div className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">Pro</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {visibleItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-white text-primary shadow-soft"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
              )
            }
          >
            <Icon className="w-[18px] h-[18px]" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
