import { createContext, useContext, useState, ReactNode } from "react";
import { Deal, DealStage, INITIAL_DEALS, INITIAL_AGENTS, Agent, ALL_TAGS } from "@/lib/mock-data";

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

interface CRMCtx {
  deals: Deal[];
  setDeals: React.Dispatch<React.SetStateAction<Deal[]>>;
  moveDeal: (id: string, stage: DealStage) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  finished: FinishedDeal[];
  finishDeal: (f: FinishedDeal) => void;
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
}

const Ctx = createContext<CRMCtx | null>(null);

export function CRMProvider({ children }: { children: ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [finished, setFinished] = useState<FinishedDeal[]>([]);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [tags, setTags] = useState<string[]>(ALL_TAGS);

  const moveDeal = (id: string, stage: DealStage) =>
    setDeals(prev => prev.map(d => (d.id === id ? { ...d, stage } : d)));
  const updateDeal = (id: string, patch: Partial<Deal>) =>
    setDeals(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));
  const finishDeal = (f: FinishedDeal) => {
    setFinished(prev => [...prev, f]);
    moveDeal(f.dealId, f.result === "venda" ? "fechado" : "perdido");
  };

  return (
    <Ctx.Provider value={{ deals, setDeals, moveDeal, updateDeal, finished, finishDeal, agents, setAgents, tags, setTags }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCRM = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCRM must be used within CRMProvider");
  return ctx;
};
