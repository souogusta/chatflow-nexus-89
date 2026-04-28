import { NavLink } from "react-router-dom";
import { LayoutDashboard, Kanban, MessageSquare, Bot, BarChart3, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/kanban", label: "Kanban", icon: Kanban },
  { to: "/conversas", label: "Conversas", icon: MessageSquare },
  { to: "/agentes", label: "Agentes", icon: Bot },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
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
        {items.map(({ to, label, icon: Icon, end }) => (
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

      <div className="mt-auto p-4 rounded-2xl bg-white/10 backdrop-blur">
        <div className="text-xs font-semibold mb-1">Plano Premium</div>
        <div className="text-[11px] text-white/75 mb-3">3 agentes IA ativos</div>
        <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full w-[68%] bg-white rounded-full" />
        </div>
      </div>
    </aside>
  );
}
