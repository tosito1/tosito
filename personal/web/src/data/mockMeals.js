import { MealType, IngredientCategory } from '../models/enums';

export const mockMeals = [
  {
    id: 'm1',
    name: 'Avena con Frutos Rojos',
    type: MealType.DESAYUNO,
    totalCalories: 450,
    totalProteins: 15,
    totalCarbs: 65,
    totalFats: 12,
    ingredients: [
      { name: 'Avena en copos', quantity: 60, unit: 'g' },
      { name: 'Leche de almendras', quantity: 200, unit: 'ml' },
      { name: 'Arándanos', quantity: 50, unit: 'g' }
    ]
  },
  {
    id: 'm2',
    name: 'Pollo con Arroz y Brócoli',
    type: MealType.ALMUERZO,
    totalCalories: 600,
    totalProteins: 45,
    totalCarbs: 55,
    totalFats: 10,
    ingredients: [
      { name: 'Pechuga de pollo', quantity: 150, unit: 'g' },
      { name: 'Arroz integral', quantity: 70, unit: 'g' },
      { name: 'Brócoli', quantity: 100, unit: 'g' }
    ]
  },
  {
    id: 'm3',
    name: 'Batido de Proteína',
    type: MealType.SNACK,
    totalCalories: 200,
    totalProteins: 25,
    totalCarbs: 5,
    totalFats: 2,
    ingredients: [
      { name: 'Whey Protein', quantity: 30, unit: 'g' }
    ]
  }
];

export const mockDayPlan = {
  date: new Date().toISOString().split('T')[0],
  plannedMeals: [
    { type: 'DESAYUNO', mealId: 'm1', eaten: true },
    { type: 'ALMUERZO', mealId: 'm2', eaten: false },
    { type: 'SNACK', mealId: 'm3', eaten: false }
  ]
};
