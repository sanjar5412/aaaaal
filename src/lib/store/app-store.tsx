"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { todayISO } from "@/lib/domain/dates";
import { generateMenu } from "@/lib/domain/menu";
import {
  addProduct,
  clearAllData,
  cookMeal,
  dismissReminder,
  markProductUsed,
  removeDemoData,
  removeProduct,
  restoreReminder,
  setMenu,
  setWarningDays,
  swapMealInPlan,
  updateProduct,
  type Deduction,
  type ProductInput,
} from "@/lib/domain/mutations";
import type { Reminder } from "@/lib/domain/reminders";
import type { AppState } from "@/lib/domain/types";
import { loadState, saveState } from "@/lib/storage/repository";
import { createDemoState } from "@/lib/storage/seed";

interface AppStoreActions {
  addProduct: (input: ProductInput) => void;
  updateProduct: (id: string, input: ProductInput) => void;
  deleteProduct: (id: string) => void;
  markUsed: (id: string) => void;
  dismissReminder: (reminder: Reminder) => void;
  restoreReminder: (key: string) => void;
  setWarningDays: (days: number) => void;
  createMenu: (days: number) => void;
  regenerateMenu: () => void;
  swapMeal: (mealId: string) => void;
  cookMeal: (mealId: string, deductions: Deduction[]) => void;
  removeDemoData: () => void;
  clearAllData: () => void;
  loadDemoData: () => void;
}

interface AppStoreValue {
  state: AppState | null;
  ready: boolean;
  storageAvailable: boolean;
  storageError: string | null;
  actions: AppStoreActions;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    const result = loadState();
    setStorageAvailable(result.storageAvailable);
    if (result.error) setStorageError(result.error);

    // Без сохранённых данных (или при повреждении) стартуем с демо-набора.
    // Если хранилища нет, storageError уже предупреждает, что данные не сохранятся.
    setState(result.state ?? createDemoState(todayISO()));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !state) return;
    const result = saveState(state);
    if (!result.ok) {
      setStorageError(result.message);
    } else {
      setStorageError(null);
    }
  }, [state, ready]);

  const mutate = useCallback((updater: (current: AppState) => AppState) => {
    setState((current) => (current ? updater(current) : current));
  }, []);

  const actions: AppStoreActions = {
    addProduct: (input) => mutate((current) => addProduct(current, input)),
    updateProduct: (id, input) =>
      mutate((current) => updateProduct(current, id, input)),
    deleteProduct: (id) => mutate((current) => removeProduct(current, id)),
    markUsed: (id) => mutate((current) => markProductUsed(current, id)),
    dismissReminder: (reminder) =>
      mutate((current) => dismissReminder(current, reminder)),
    restoreReminder: (key) =>
      mutate((current) => restoreReminder(current, key)),
    setWarningDays: (days) => mutate((current) => setWarningDays(current, days)),
    createMenu: (days) =>
      mutate((current) =>
        setMenu(
          current,
          generateMenu({
            products: current.products,
            days,
            startDate: todayISO(),
            warningDays: current.settings.warningDays,
            seed: `${Date.now()}-${Math.random()}`,
          }),
        ),
      ),
    regenerateMenu: () =>
      mutate((current) =>
        setMenu(
          current,
          generateMenu({
            products: current.products,
            days: current.menu?.days ?? 3,
            startDate: todayISO(),
            warningDays: current.settings.warningDays,
            seed: `${Date.now()}-${Math.random()}`,
          }),
        ),
      ),
    // Результат не возвращаем: updater выполняется при рендере, а не здесь.
    swapMeal: (mealId) =>
      mutate((current) => swapMealInPlan(current, mealId)),
    cookMeal: (mealId, deductions) =>
      mutate((current) => cookMeal(current, mealId, deductions).state),
    removeDemoData: () => mutate(removeDemoData),
    clearAllData: () => mutate(clearAllData),
    loadDemoData: () => setState(createDemoState(todayISO())),
  };

  return (
    <AppStoreContext.Provider
      value={{ state, ready, storageAvailable, storageError, actions }}
    >
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStoreValue {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error("useAppStore должен использоваться внутри AppStoreProvider");
  }
  return context;
}
