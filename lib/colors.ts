/**
 * Color palette for categories and UI elements
 */

export const CATEGORY_COLORS = [
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
];

/**
 * Map category name to a stable color
 * Uses the same algorithm as backend for consistency
 */
export function getCategoryColor(categoryName: string): string {
  // Simple stable hash function
  let hash = 0;
  const str = categoryName.toLowerCase();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
}

// Status colors
export const STATUS_COLORS = {
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  info: '#06b6d4', // cyan-500
};

// Text colors for dark theme
export const TEXT_COLORS = {
  positive: '#86efac', // green-300
  negative: '#f87171', // red-400
  neutral: '#cbd5e1', // slate-300
  muted: '#94a3b8', // slate-400
};
