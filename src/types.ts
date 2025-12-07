import { LucideIcon } from 'lucide-react';

export interface Feature {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Industry {
  name: string;
  icon: LucideIcon;
}

export type PlanId = "starter" | "business" | "premium" | "enterprise";

export interface PricingPlan {
  id: PlanId;
  name: string;
  price: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  badge?: string;
  description?: string;
  priceNote?: string;
  ctaSubLabel?: string;
}