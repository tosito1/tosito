import { TransactionType, TransactionCategory } from '../models/enums';

export const mockTransactions = [
  { id: 't1', type: TransactionType.INCOME, category: TransactionCategory.SALARIO, amount: 2500, description: 'Nómina Abril', date: '2026-04-01' },
  { id: 't2', type: TransactionType.EXPENSE, category: TransactionCategory.ALQUILER, amount: 850.00, description: 'Alquiler Abril', date: '2026-04-01' },
  { id: 't3', type: TransactionType.EXPENSE, category: TransactionCategory.ALIMENTACION, amount: 120.50, description: 'Compra semanal Carrefour', date: '2026-04-05' },
  { id: 't4', type: TransactionType.EXPENSE, category: TransactionCategory.SUMINISTROS, amount: 65.20, description: 'Factura Electricidad (Endesa)', date: '2026-04-10' },
  { id: 't5', type: TransactionType.EXPENSE, category: TransactionCategory.TRANSPORTE, amount: 45.00, description: 'Abono Transporte mensual', date: '2026-04-02' },
  { id: 't6', type: TransactionType.EXPENSE, category: TransactionCategory.BEBIDA, amount: 85.00, description: 'Cenas y copas Viernes (Casi al límite)', date: '2026-04-12' },
  { id: 't7', type: TransactionType.EXPENSE, category: TransactionCategory.TABACO, amount: 5.50, description: 'Tabaco Winston', date: '2026-04-14' },
  { id: 't8', type: TransactionType.EXPENSE, category: TransactionCategory.SALUD, amount: 25.00, description: 'Farmacia - Medicamentos', date: '2026-04-15' },
  { id: 't9', type: TransactionType.EXPENSE, category: TransactionCategory.TABACO, amount: 45.50, description: 'Caja de Puros (Límite excedido)', date: '2026-04-18' },
];

export const mockBudgets = [
  { id: 'b1', categoryId: 'TABACO', limit: 40, emoji: '🚬', label: 'Tabaco' },
  { id: 'b2', categoryId: 'BEBIDA', limit: 100, emoji: '🍹', label: 'Bebida' },
  { id: 'b3', categoryId: 'ALIMENTACION', limit: 400, emoji: '🛒', label: 'Alimentación' },
];

export const mockSavingsGoals = [
  {
    id: 'g1',
    name: 'Fondo de Emergencia',
    targetAmount: 5000,
    currentAmount: 3200,
    emoji: '🛡️',
    color: '#10b981'
  },
  {
    id: 'g2',
    name: 'Viaje a Japón',
    targetAmount: 3000,
    currentAmount: 1250,
    emoji: '✈️',
    color: '#3b82f6'
  }
];
