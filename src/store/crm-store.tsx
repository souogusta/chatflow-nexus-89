import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Deal, DealStage, INITIAL_DEALS, INITIAL_AGENTS, Agent, ALL_TAGS, STAGES, Stage, SELLERS } from "@/lib/mock-data";

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

export type TeamUser = {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  photoUrl?: string;
  email: string;
  phone?: string;
  role: string;
  password: string;
  active: boolean;
};

export type AccountProfile = {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  photoUrl?: string;
};

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
  teamUsers: TeamUser[];
  setTeamUsers: React.Dispatch<React.SetStateAction<TeamUser[]>>;
  accountProfile: AccountProfile;
  setAccountProfile: React.Dispatch<React.SetStateAction<AccountProfile>>;
  currentUser: TeamUser | null;
  isAdmin: boolean;
  login: (identifier: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (permission: PermissionKey) => boolean;
  canViewDeal: (deal: Deal) => boolean;
}

const Ctx = createContext<CRMCtx | null>(null);

export const PERMISSIONS = [
  "Ver dashboard",
  "Ver todos os atendimentos",
  "Ver apenas próprios atendimentos",
  "Editar funil",
  "Finalizar venda",
  "Criar agentes",
  "Editar agentes",
  "Ver relatórios",
  "Exportar dados",
  "Criar usuários",
  "Alterar configurações da empresa",
] as const;

export type PermissionKey = typeof PERMISSIONS[number];

const DEFAULT_PERMISSIONS: Record<string, PermissionKey[]> = {
  Administrador: [...PERMISSIONS],
  Gerente: PERMISSIONS.filter(permission => !["Criar usuários", "Alterar configurações da empresa", "Editar funil"].includes(permission)),
  Vendedora: ["Ver dashboard", "Ver apenas próprios atendimentos", "Finalizar venda"],
  Suporte: ["Ver dashboard", "Ver todos os atendimentos", "Ver relatórios"],
};

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

const adminUser: TeamUser = {
  id: "admin",
  name: "Administrador",
  username: "admin",
  avatar: "AD",
  email: "admin@empresa.com",
  phone: "",
  role: "Administrador",
  password: "admin123",
  active: true,
};

const initialTeamUsers: TeamUser[] = [
  adminUser,
  ...SELLERS.map((seller, index) => ({
    ...seller,
    username: seller.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(" ")[0],
    email: `${seller.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(" ", ".")}@empresa.com`,
    phone: index === 0 ? "+55 11 98765-4321" : "",
    role: "Vendedora",
    password: index === 0 ? "ana123" : "123456",
    active: true,
  })),
];

const initialAccountProfile: AccountProfile = {
  name: adminUser.name,
  email: adminUser.email,
  phone: adminUser.phone || "",
  role: adminUser.role,
  avatar: adminUser.avatar,
  photoUrl: adminUser.photoUrl,
};

const normalizeTeamUsers = (users: TeamUser[]) => {
  const withRequiredFields = users.map(user => {
    const isLegacyUser = !user.password;
    return {
      ...user,
      role: user.id !== "admin" && isLegacyUser && user.role === "Administrador" ? "Vendedora" : user.role,
      password: user.password || (user.id === "admin" ? "admin123" : "123456"),
      username: user.username || (user.id === "admin" ? "admin" : user.email.split("@")[0]),
    };
  });

  return withRequiredFields.some(user => user.id === "admin")
    ? withRequiredFields.map(user => user.id === "admin" ? { ...adminUser, ...user, role: "Administrador" } : user)
    : [adminUser, ...withRequiredFields];
};

const profileFromUser = (user: TeamUser): AccountProfile => ({
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  role: user.role,
  avatar: user.avatar,
  photoUrl: user.photoUrl,
});

export function CRMProvider({ children }: { children: ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>(() => loadStored("crm-deals", INITIAL_DEALS));
  const [finished, setFinished] = useState<FinishedDeal[]>([]);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [tags, setTags] = useState<string[]>(ALL_TAGS);
  const [stages, setStages] = useState<Stage[]>(() => loadStored("crm-stages", STAGES));
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadStored("crm-appointments", INITIAL_APPOINTMENTS));
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>(() => normalizeTeamUsers(loadStored("crm-team-users", initialTeamUsers)));
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => loadStored("crm-current-user-id", null));
  const [accountProfile, setAccountProfile] = useState<AccountProfile>(() => loadStored("crm-account-profile", initialAccountProfile));

  const currentUser = teamUsers.find(user => user.id === currentUserId && user.active) || null;
  const isAdmin = currentUser?.role === "Administrador";

  useEffect(() => {
    window.localStorage.setItem("crm-deals", JSON.stringify(deals));
  }, [deals]);

  useEffect(() => {
    window.localStorage.setItem("crm-stages", JSON.stringify(stages));
  }, [stages]);

  useEffect(() => {
    window.localStorage.setItem("crm-appointments", JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    window.localStorage.setItem("crm-team-users", JSON.stringify(teamUsers));
  }, [teamUsers]);

  useEffect(() => {
    window.localStorage.setItem("crm-account-profile", JSON.stringify(accountProfile));
  }, [accountProfile]);

  useEffect(() => {
    if (currentUserId) {
      window.localStorage.setItem("crm-current-user-id", JSON.stringify(currentUserId));
    } else {
      window.localStorage.removeItem("crm-current-user-id");
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUser) setAccountProfile(profileFromUser(currentUser));
  }, [currentUser]);

  const login = (identifier: string, password: string) => {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = teamUsers.find(item =>
      item.active &&
      item.password === password &&
      [item.username, item.email, item.name].filter(Boolean).some(value => value?.toLowerCase() === normalizedIdentifier)
    );

    if (!user) return false;
    setCurrentUserId(user.id);
    setAccountProfile(profileFromUser(user));
    return true;
  };

  const logout = () => setCurrentUserId(null);

  const hasPermission = (permission: PermissionKey) => {
    if (!currentUser) return false;
    if (currentUser.role === "Administrador") return true;
    return (DEFAULT_PERMISSIONS[currentUser.role] || []).includes(permission);
  };

  const canViewDeal = (deal: Deal) => hasPermission("Ver todos os atendimentos") || deal.sellerId === currentUser?.id;

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
    <Ctx.Provider value={{ deals, setDeals, addDeal, moveDeal, updateDeal, stages, addStage, updateStage, moveStage, reorderStage, removeStage, appointments, addAppointment, updateAppointment, removeAppointment, finished, finishDeal, agents, setAgents, tags, setTags, teamUsers, setTeamUsers, accountProfile, setAccountProfile, currentUser, isAdmin, login, logout, hasPermission, canViewDeal }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCRM = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCRM must be used within CRMProvider");
  return ctx;
};
