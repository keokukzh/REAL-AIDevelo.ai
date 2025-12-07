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

export interface PricingPlan {
  name: string;
  price: string;
  originalPrice: string;
  features: string[];
  cta: string;
  popular?: boolean;
  description?: string;
}