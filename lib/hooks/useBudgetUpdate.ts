import { useEffect } from 'react';

/**
 * Hook to listen for budget updates from the dashboard
 * and trigger a callback when detected
 */
export function useBudgetUpdate(callback: () => void) {
  useEffect(() => {
    const handleBudgetUpdate = (e: StorageEvent) => {
      if (e.key === 'budgetUpdated' && e.newValue) {
        callback();
      }
    };

    window.addEventListener('storage', handleBudgetUpdate);
    return () => window.removeEventListener('storage', handleBudgetUpdate);
  }, [callback]);
}
