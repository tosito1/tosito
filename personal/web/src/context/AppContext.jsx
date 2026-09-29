import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockTransactions, mockSavingsGoals, mockBudgets } from '../data/mockSavings';
import { mockMeals } from '../data/mockMeals';
import { mockRoutines, mockHistory } from '../data/mockGym';
import { mockEvents, mockScheduleBlocks } from '../data/mockCalendar';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // --- STATE ---
  const [transactions, setTransactions] = useState(mockTransactions);
  const [savingsGoals, setSavingsGoals] = useState(mockSavingsGoals);
  const [budgets, setBudgets] = useState(mockBudgets);
  const [meals, setMeals] = useState(mockMeals);
  const [gymRoutines, setGymRoutines] = useState(mockRoutines);
  const [gymHistory, setGymHistory] = useState(mockHistory);
  const [calendarEvents, setCalendarEvents] = useState(mockEvents);
  const [scheduleBlocks, setScheduleBlocks] = useState(mockScheduleBlocks);

  // --- PERSISTENCE ---
  useEffect(() => {
    const data = localStorage.getItem('tosito_global_state');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.savingsGoals) setSavingsGoals(parsed.savingsGoals);
        if (parsed.budgets) setBudgets(parsed.budgets);
        if (parsed.meals) setMeals(parsed.meals);
        if (parsed.gymRoutines) setGymRoutines(parsed.gymRoutines);
        if (parsed.gymHistory) setGymHistory(parsed.gymHistory);
        if (parsed.calendarEvents) setCalendarEvents(parsed.calendarEvents);
        if (parsed.scheduleBlocks) setScheduleBlocks(parsed.scheduleBlocks);
      } catch (e) {
        console.error("Error loading state", e);
      }
    }
  }, []);

  useEffect(() => {
    const state = { transactions, savingsGoals, budgets, meals, gymRoutines, gymHistory, calendarEvents, scheduleBlocks };
    localStorage.setItem('tosito_global_state', JSON.stringify(state));
  }, [transactions, savingsGoals, budgets, meals, gymRoutines, gymHistory, calendarEvents, scheduleBlocks]);

  // --- ACTIONS ---
  
  // Savings Actions
  const addTransaction = (t) => setTransactions(prev => [...prev, { ...t, id: Date.now().toString() }]);
  
  // Meals Actions
  const addMeal = (m) => setMeals(prev => [...prev, { ...m, id: Date.now().toString() }]);
  
  // Shared Actions (Synchronization)
  /**
   * Logs a meal and optionally creates a related financial transaction
   */
  const logMealWithExpense = (mealData, expenseAmount = null) => {
    addMeal(mealData);
    if (expenseAmount) {
      addTransaction({
        type: { id: "EXPENSE", label: "Gasto", emoji: "📉" },
        category: { id: "RESTAURANTE", label: "Restaurante", emoji: "🍽️", type: "EXPENSE" },
        amount: expenseAmount,
        description: `Comida: ${mealData.name}`,
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const value = {
    transactions, setTransactions, addTransaction,
    savingsGoals, setSavingsGoals,
    budgets, setBudgets,
    meals, setMeals, addMeal, logMealWithExpense,
    gymRoutines, setGymRoutines,
    gymHistory, setGymHistory,
    calendarEvents, setCalendarEvents,
    scheduleBlocks, setScheduleBlocks
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
