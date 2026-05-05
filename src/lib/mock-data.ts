import agentsData from "@/banco-de-dados/agents.json";
import dealsData from "@/banco-de-dados/deals.json";
import monthlySeriesData from "@/banco-de-dados/monthly-series.json";
import modelOptionsData from "@/banco-de-dados/model-options.json";
import refusalPieData from "@/banco-de-dados/refusal-pie.json";
import refusalReasonsData from "@/banco-de-dados/refusal-reasons.json";
import sellerRankingData from "@/banco-de-dados/seller-ranking.json";
import sellersData from "@/banco-de-dados/sellers.json";
import stagesData from "@/banco-de-dados/stages.json";
import tagsData from "@/banco-de-dados/tags.json";

export type Temperature = "quente" | "morno" | "frio";
export type DealStage = string;
export interface Stage {
  id: DealStage;
  title: string;
  color: string;
}

export interface Deal {
  id: string;
  customer: string;
  phone: string;
  avatar?: string;
  lastMessage: string;
  interest?: string;
  lastInteraction: string;
  sellerId: string;
  assignedSellerIds?: string[];
  temperature: Temperature;
  tags: string[];
  unread: boolean;
  estimatedValue?: number;
  stage: DealStage;
  notes?: string;
}

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

export const STAGES = stagesData as Stage[];
export const SELLERS = sellersData;
export const REFUSAL_REASONS = refusalReasonsData;
export const ALL_TAGS = tagsData;
export const INITIAL_DEALS = dealsData as Deal[];
export const MONTHLY_SERIES = monthlySeriesData;
export const REFUSAL_PIE = refusalPieData;
export const SELLER_RANKING = sellerRankingData;
export const MODEL_OPTIONS = modelOptionsData as {
  id: Agent["model"];
  label: string;
  model: string;
  desc: string;
}[];
export const INITIAL_AGENTS = agentsData as Agent[];
