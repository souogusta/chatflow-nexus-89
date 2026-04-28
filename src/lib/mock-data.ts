export type Temperature = "quente" | "morno" | "frio";
export type DealStage =
  | "novo-lead"
  | "primeiro-contato"
  | "em-atendimento"
  | "proposta-enviada"
  | "negociacao"
  | "aguardando-resposta"
  | "fechado"
  | "perdido";

export const STAGES: { id: DealStage; title: string; color: string }[] = [
  { id: "novo-lead", title: "Novo lead", color: "bg-info" },
  { id: "primeiro-contato", title: "Primeiro contato", color: "bg-info" },
  { id: "em-atendimento", title: "Em atendimento", color: "bg-primary" },
  { id: "proposta-enviada", title: "Proposta enviada", color: "bg-primary" },
  { id: "negociacao", title: "Negociação", color: "bg-warning" },
  { id: "aguardando-resposta", title: "Aguardando resposta", color: "bg-warning" },
  { id: "fechado", title: "Fechado", color: "bg-success" },
  { id: "perdido", title: "Perdido", color: "bg-destructive" },
];

export const SELLERS = [
  { id: "s1", name: "Ana Paula", avatar: "AP" },
  { id: "s2", name: "Camila Rocha", avatar: "CR" },
  { id: "s3", name: "Juliana Martins", avatar: "JM" },
  { id: "s4", name: "Beatriz Souza", avatar: "BS" },
  { id: "s5", name: "Fernanda Lima", avatar: "FL" },
];

export const REFUSAL_REASONS = [
  "Preço alto",
  "Cliente sem orçamento",
  "Comprou com concorrente",
  "Não teve interesse",
  "Prazo não atende",
  "Não respondeu mais",
  "Não confia na solução",
  "Está apenas pesquisando",
  "Outros",
];

export const ALL_TAGS = [
  "Urgente",
  "Retornar hoje",
  "Cliente antigo",
  "Pedido grande",
  "Sem orçamento",
  "Aguardando pagamento",
  "Enviar proposta",
  "Pós-venda",
];

export interface Deal {
  id: string;
  customer: string;
  phone: string;
  avatar?: string;
  lastMessage: string;
  lastInteraction: string; // ISO
  sellerId: string;
  temperature: Temperature;
  tags: string[];
  unread: boolean;
  estimatedValue?: number;
  stage: DealStage;
  notes?: string;
}

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

export const INITIAL_DEALS: Deal[] = [
  { id: "d1", customer: "Marina Costa", phone: "+55 11 98123-4567", lastMessage: "Qual o melhor preço para 50 unidades?", lastInteraction: hoursAgo(0.3), sellerId: "s1", temperature: "quente", tags: ["Urgente", "Pedido grande"], unread: true, estimatedValue: 12500, stage: "negociacao" },
  { id: "d2", customer: "+55 21 99876-1234", phone: "+55 21 99876-1234", lastMessage: "Olá, vi o anúncio no Instagram", lastInteraction: hoursAgo(0.8), sellerId: "s2", temperature: "morno", tags: ["Enviar proposta"], unread: true, estimatedValue: 3200, stage: "novo-lead" },
  { id: "d3", customer: "Roberto Almeida", phone: "+55 31 98711-2233", lastMessage: "Vou pensar e retorno amanhã", lastInteraction: hoursAgo(18), sellerId: "s3", temperature: "frio", tags: ["Sem orçamento"], unread: false, estimatedValue: 1800, stage: "aguardando-resposta" },
  { id: "d4", customer: "Larissa Mendes", phone: "+55 11 97654-3210", lastMessage: "Perfeito! Pode mandar o boleto", lastInteraction: hoursAgo(0.1), sellerId: "s1", temperature: "quente", tags: ["Aguardando pagamento"], unread: false, estimatedValue: 4500, stage: "fechado" },
  { id: "d5", customer: "Tiago Ferreira", phone: "+55 41 99988-7766", lastMessage: "Quanto fica o frete pra Curitiba?", lastInteraction: hoursAgo(2.4), sellerId: "s4", temperature: "morno", tags: ["Retornar hoje"], unread: true, estimatedValue: 2200, stage: "em-atendimento" },
  { id: "d6", customer: "Patrícia Nogueira", phone: "+55 11 99000-1122", lastMessage: "Recebi a proposta, vou avaliar", lastInteraction: hoursAgo(5), sellerId: "s5", temperature: "morno", tags: ["Enviar proposta"], unread: false, estimatedValue: 8900, stage: "proposta-enviada" },
  { id: "d7", customer: "Eduardo Pires", phone: "+55 51 98765-0001", lastMessage: "Bom dia, gostaria de saber mais", lastInteraction: hoursAgo(1.2), sellerId: "s2", temperature: "morno", tags: [], unread: true, estimatedValue: 1500, stage: "primeiro-contato" },
  { id: "d8", customer: "Camila Reis", phone: "+55 11 96543-2210", lastMessage: "Fechado, vamos seguir!", lastInteraction: hoursAgo(0.5), sellerId: "s1", temperature: "quente", tags: ["Cliente antigo"], unread: false, estimatedValue: 15600, stage: "negociacao" },
  { id: "d9", customer: "+55 71 99911-2244", phone: "+55 71 99911-2244", lastMessage: "Comprei com outro fornecedor, obrigado", lastInteraction: hoursAgo(48), sellerId: "s3", temperature: "frio", tags: [], unread: false, estimatedValue: 0, stage: "perdido" },
  { id: "d10", customer: "Helena Vasconcelos", phone: "+55 11 98800-1199", lastMessage: "Preciso para amanhã, tem disponível?", lastInteraction: hoursAgo(0.05), sellerId: "s4", temperature: "quente", tags: ["Urgente"], unread: true, estimatedValue: 6700, stage: "primeiro-contato" },
  { id: "d11", customer: "Rafael Drumond", phone: "+55 31 99007-7700", lastMessage: "Aguardo a proposta", lastInteraction: hoursAgo(8), sellerId: "s5", temperature: "morno", tags: ["Enviar proposta"], unread: false, estimatedValue: 3400, stage: "proposta-enviada" },
  { id: "d12", customer: "Sofia Andrade", phone: "+55 11 91234-9988", lastMessage: "Obrigada, recebi o produto!", lastInteraction: hoursAgo(72), sellerId: "s2", temperature: "morno", tags: ["Pós-venda"], unread: false, estimatedValue: 2100, stage: "fechado" },
];

export const MONTHLY_SERIES = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  atendimentos: 30 + Math.round(Math.sin(i / 3) * 12 + Math.random() * 18),
  vendas: 8 + Math.round(Math.cos(i / 4) * 4 + Math.random() * 6),
}));

export const REFUSAL_PIE = [
  { name: "Preço alto", value: 32 },
  { name: "Sem orçamento", value: 21 },
  { name: "Comprou com concorrente", value: 18 },
  { name: "Não respondeu mais", value: 15 },
  { name: "Apenas pesquisando", value: 9 },
  { name: "Outros", value: 5 },
];

export const SELLER_RANKING = SELLERS.map((s, i) => ({
  ...s,
  atendimentos: 80 - i * 9 + Math.floor(Math.random() * 8),
  vendas: 24 - i * 3 + Math.floor(Math.random() * 4),
  conversao: +(28 - i * 2.4 + Math.random() * 3).toFixed(1),
  tempoMedio: `${2 + i}m ${10 + i * 7}s`,
}));

export interface Agent {
  id: string;
  name: string;
  description: string;
  prompt: string;
  model: "econom" | "balanced" | "premium";
  temperature: number;
  active: boolean;
  conversations: number;
  updatedAt: string;
  channel: string;
  triggerTags: string[];
  blockWords: string[];
  handoffMessage: string;
}

export const MODEL_OPTIONS = [
  { id: "econom", label: "Econômico", model: "gpt-5.4-nano", desc: "Triagem e respostas simples" },
  { id: "balanced", label: "Balanceado", model: "gpt-5.4-mini", desc: "Atendimento comercial padrão" },
  { id: "premium", label: "Premium", model: "gpt-5.5", desc: "Vendas consultivas complexas" },
] as const;

export const INITIAL_AGENTS: Agent[] = [
  { id: "a1", name: "Triagem Inicial", description: "Recebe e qualifica todos os leads novos", prompt: "Você é um SDR amigável. Cumprimente, descubra a necessidade do cliente e colete nome, produto de interesse e prazo.", model: "econom", temperature: 0.6, active: true, conversations: 412, updatedAt: hoursAgo(2), channel: "WhatsApp Principal", triggerTags: ["novo"], blockWords: ["reclamação"], handoffMessage: "Vou te transferir para um especialista, um momento 🙂" },
  { id: "a2", name: "Vendedor Consultivo", description: "Conduz negociações e envia propostas", prompt: "Você é vendedor consultivo. Faça perguntas abertas, identifique dores e apresente soluções com valor.", model: "premium", temperature: 0.7, active: true, conversations: 187, updatedAt: hoursAgo(20), channel: "WhatsApp Principal", triggerTags: ["proposta"], blockWords: [], handoffMessage: "Vou chamar um humano para finalizar." },
  { id: "a3", name: "Pós-venda", description: "Acompanha entregas e coleta feedback", prompt: "Você cuida do pós-venda. Confirme satisfação, peça avaliação e ofereça suporte.", model: "balanced", temperature: 0.5, active: false, conversations: 96, updatedAt: hoursAgo(72), channel: "WhatsApp Suporte", triggerTags: ["pos-venda"], blockWords: [], handoffMessage: "Vou te direcionar ao suporte." },
];
