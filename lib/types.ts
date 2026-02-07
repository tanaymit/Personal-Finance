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
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}
