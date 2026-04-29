import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Deal, DealStage, INITIAL_DEALS, INITIAL_AGENTS, Agent, ALL_TAGS, STAGES, Stage } from "@/lib/mock-data";

interface FinishedDeal {
  dealId: string;
  result: "venda" | "recusa";
  amount?: number;
  description?: string;
  product?: string;
  payment?: string;
  reason?: string;
  notes?: string;
  finishedAt: string;
  operatorId: string;
}

export type AppointmentType = "ligacao" | "reuniao" | "follow-up" | "demonstracao" | "retorno-comercial" | "outro";

export interface Appointment {
  id: string;
  title: string;
  dealId: string;
  date: string;
  startTime: string;
  endTime: string;
  sellerId: string;
  description: string;
  type: AppointmentType;
}

interface CRMCtx {
  deals: Deal[];
  setDeals: React.Dispatch<React.SetStateAction<Deal[]>>;
  addDeal: (deal: Deal) => void;
  moveDeal: (id: string, stage: DealStage) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  stages: Stage[];
  addStage: (title: string, color?: string) => void;
  updateStage: (id: string, patch: Partial<Stage>) => void;
  moveStage: (id: string, direction: "up" | "down") => void;
  reorderStage: (activeId: string, overId: string) => void;
  removeStage: (id: string) => boolean;
  appointments: Appointment[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  removeAppointment: (id: string) => void;
  finished: FinishedDeal[];
  finishDeal: (f: FinishedDeal) => void;
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
}

const Ctx = createContext<CRMCtx | null>(null);

const loadStored = <T,>(key: string, fallback: T) => {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  } catch {
    return fallback;
  }
};

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    title: "Follow-up proposta",
    dealId: "d1",
    date: "2026-04-30",
    startTime: "14:00",
    endTime: "14:30",
    sellerId: "s1",
    description: "Revisar desconto e prazo para fechamento.",
    type: "follow-up",
  },
  {
    id: "a2",
    title: "Demonstração produto",
    dealId: "d13",
    date: "2026-04-30",
    startTime: "10:00",
    endTime: "11:00",
    sellerId: "s1",
    description: "Apresentar linha B2B e condições fiscais.",
    type: "demonstracao",
  },
];

export function CRMProvider({ children }: { children: ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>(() => loadStored("crm-deals", INITIAL_DEALS));
  const [finished, setFinished] = useState<FinishedDeal[]>([]);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [tags, setTags] = useState<string[]>(ALL_TAGS);
  const [stages, setStages] = useState<Stage[]>(() => loadStored("crm-stages", STAGES));
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadStored("crm-appointments", INITIAL_APPOINTMENTS));

  useEffect(() => {
    window.localStorage.setItem("crm-deals", JSON.stringify(deals));
  }, [deals]);

  useEffect(() => {
    window.localStorage.setItem("crm-stages", JSON.stringify(stages));
  }, [stages]);

  useEffect(() => {
    window.localStorage.setItem("crm-appointments", JSON.stringify(appointments));
  }, [appointments]);

  const addDeal = (deal: Deal) => setDeals(prev => [deal, ...prev]);
  const moveDeal = (id: string, stage: DealStage) =>
    setDeals(prev => prev.map(d => (d.id === id ? { ...d, stage } : d)));
  const updateDeal = (id: string, patch: Partial<Deal>) =>
    setDeals(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));
  const addStage = (title: string, color = "bg-primary") => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const baseId = cleanTitle
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `etapa-${Date.now()}`;
    const id = stages.some(stage => stage.id === baseId) ? `${baseId}-${Date.now()}` : baseId;
    const stage = { id, title: cleanTitle, color };

    setStages(prev => {
      const closingIndex = prev.findIndex(item => item.id === "fechado");
      if (closingIndex < 0) return [...prev, stage];
      return [...prev.slice(0, closingIndex), stage, ...prev.slice(closingIndex)];
    });
  };
  const updateStage = (id: string, patch: Partial<Stage>) =>
    setStages(prev => prev.map(stage => (stage.id === id ? { ...stage, ...patch } : stage)));
  const moveStage = (id: string, direction: "up" | "down") =>
    setStages(prev => {
      const index = prev.findIndex(stage => stage.id === id);
      if (index < 0) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  const reorderStage = (activeId: string, overId: string) =>
    setStages(prev => {
      const activeIndex = prev.findIndex(stage => stage.id === activeId);
      const overIndex = prev.findIndex(stage => stage.id === overId);
      if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return prev;

      const next = [...prev];
      const [moved] = next.splice(activeIndex, 1);
      next.splice(overIndex, 0, moved);
      return next;
    });
  const removeStage = (id: string) => {
    if (id === "fechado" || id === "perdido") return false;
    const fallback = stages.find(stage => stage.id !== id)?.id || "novo-lead";
    setStages(prev => prev.filter(stage => stage.id !== id));
    setDeals(prev => prev.map(deal => (deal.stage === id ? { ...deal, stage: fallback } : deal)));
    return true;
  };
  const finishDeal = (f: FinishedDeal) => {
    setFinished(prev => [...prev, f]);
    setDeals(prev => prev.map(deal => {
      if (deal.id !== f.dealId) return deal;

      return {
        ...deal,
        stage: f.result === "venda" ? "fechado" : "perdido",
        estimatedValue: f.result === "venda" && f.amount !== undefined ? f.amount : deal.estimatedValue,
      };
    }));
  };
  const addAppointment = (appointment: Appointment) =>
    setAppointments(prev => [...prev, appointment].sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)));
  const updateAppointment = (id: string, patch: Partial<Appointment>) =>
    setAppointments(prev => prev.map(appointment => (appointment.id === id ? { ...appointment, ...patch } : appointment)));
  const removeAppointment = (id: string) =>
    setAppointments(prev => prev.filter(appointment => appointment.id !== id));

  return (
    <Ctx.Provider value={{ deals, setDeals, addDeal, moveDeal, updateDeal, stages, addStage, updateStage, moveStage, reorderStage, removeStage, appointments, addAppointment, updateAppointment, removeAppointment, finished, finishDeal, agents, setAgents, tags, setTags }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCRM = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCRM must be used within CRMProvider");
  return ctx;
};
