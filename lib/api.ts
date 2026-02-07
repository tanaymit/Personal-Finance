/**
 * API integration layer for the Personal Finance Dashboard
 * These functions connect to FastAPI backend endpoints
 */

import {
  Transaction,
  Category,
  UploadedReceipt,
  BudgetSummary,
  FilterOptions
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Fetch all transactions from FastAPI backend
 * GET /transactions
 */
export async function fetchTransactions(filters?: FilterOptions): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.category) params.set('category', filters.category);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.minAmount) params.set('minAmount', String(filters.minAmount));
    if (filters.maxAmount) params.set('maxAmount', String(filters.maxAmount));
    if (filters.search) params.set('search', filters.search);
  }

  const url = `${API_BASE_URL}/transactions${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch transactions: ${res.status}`);
  }

  const data = (await res.json()) as Transaction[];
  return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Fetch all spending categories from FastAPI backend
 * GET /categories
 */
export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE_URL}/categories`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.status}`);
  }

  return (await res.json()) as Category[];
}

/**
 * Create a new transaction on FastAPI backend
 * POST /transactions
 */
export async function createTransaction(
  transaction: Omit<Transaction, 'id'>
): Promise<Transaction> {
  const res = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });

  if (!res.ok) {
    throw new Error(`Failed to create transaction: ${res.status}`);
  }

  return (await res.json()) as Transaction;
}

/**
 * Upload a receipt file for OCR processing
 * POST /upload-receipt with multipart form-data
 * Backend will extract merchant, total, and date using OCR
 */
export async function uploadReceipt(file: File): Promise<UploadedReceipt> {
  console.log(`📤 Uploading receipt: ${file.name} (${file.size} bytes)`);
  
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${API_BASE_URL}/upload-receipt`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Upload failed: ${res.status} - ${errorText}`);
      throw new Error(`Upload failed: ${res.status}`);
    }

    const data = await res.json();
    console.log(`✅ Upload successful:`, data);
    return data as UploadedReceipt;
  } catch (error) {
    console.error(`❌ Upload error:`, error);
    throw error;
  }
}

/**
 * Fetch budget summary from FastAPI backend
 * GET /budget-summary
 */
export async function fetchBudgetSummary(): Promise<BudgetSummary> {
  const res = await fetch(`${API_BASE_URL}/budget-summary`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch budget summary: ${res.status}`);
  }

  return (await res.json()) as BudgetSummary;
}

/**
 * Update a category on FastAPI backend
 * PUT /categories/{id}
 */
export async function updateCategory(
  id: string,
  data: Partial<Category>
): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`Failed to update category: ${res.status}`);
  }

  return (await res.json()) as Category;
}

/**
 * Delete a transaction from FastAPI backend
 * DELETE /transactions/{id}
 */
export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/transactions/${id}`, { method: 'DELETE' });

  if (!res.ok) {
    throw new Error(`Failed to delete transaction: ${res.status}`);
  }
}

/**
 * Get transactions grouped by category for chart visualization
 */
export async function getTransactionsByCategory(): Promise<Record<string, number>> {
  const transactions = await fetchTransactions();
  const grouped: Record<string, number> = {};

  transactions.forEach(t => {
    grouped[t.category] = (grouped[t.category] || 0) + t.amount;
  });

  return grouped;
}

/**
 * Get transactions grouped by date for trend visualization
 */
export async function getTransactionsByDate(days: number = 30): Promise<Array<{ date: string; total: number }>> {
  const transactions = await fetchTransactions();
  const grouped: Record<string, number> = {};
  
  const now = new Date();
  const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  transactions
    .filter(t => new Date(t.date) >= pastDate)
    .forEach(t => {
      grouped[t.date] = (grouped[t.date] || 0) + t.amount;
    });

  return Object.entries(grouped)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
