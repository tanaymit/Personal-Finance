/**
 * TypeScript interfaces for the Personal Finance Dashboard
 */

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  date: string; // ISO date string
  description?: string;
  paymentMethod?: string;
}

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  targetDate?: string | null;
  note?: string | null;
  createdAt: string;
};

export type GoalIn = {
  name: string;
  targetAmount: number;
  targetDate?: string | null;
  note?: string | null;
};

export type AssistantChatRequest = {
  message: string;
  year?: number;
  month?: number;
  startingBalance?: number;
};

export type AssistantChatResponse = {
  tier: number;
  answer: string;
  toolPlan?: unknown;
  facts?: unknown;
};

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
  color: string; // hex color
  budgetLimit?: number;
  spent: number;
}

export interface UploadedReceipt {
  id: string;
  fileName: string;
  uploadDate: string;
  ocrData: {
    merchant: string;
    amount: number;
    date: string;
    items?: Array<{
      name: string;
      price: number;
    }>;
    suggestedCategory: string;
  };
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  largestCategory: string;
  largestCategoryAmount: number;
}

export interface FilterOptions {
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}
