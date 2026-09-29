// Calendar Enums
export const EventCategory = {
  PERSONAL: { id: "PERSONAL", label: "Personal", emoji: "👤", color: "#8b5cf6" },
  TRABAJO: { id: "TRABAJO", label: "Trabajo", emoji: "💼", color: "#3b82f6" },
  SALUD: { id: "SALUD", label: "Salud", emoji: "🏥", color: "#10b981" },
  GYM: { id: "GYM", label: "Gym", emoji: "💪", color: "#ef4444" },
  SOCIAL: { id: "SOCIAL", label: "Social", emoji: "🎉", color: "#f59e0b" },
  OTRO: { id: "OTRO", label: "Otro", emoji: "📌", color: "#94a3b8" }
};

export const EventPriority = {
  HIGH: { id: "HIGH", label: "Alta" },
  MEDIUM: { id: "MEDIUM", label: "Media" },
  LOW: { id: "LOW", label: "Baja" }
};

// Gym Enums
export const MuscleGroup = {
  PECHO: { id: "PECHO", label: "Pecho", emoji: "💪" },
  ESPALDA: { id: "ESPALDA", label: "Espalda", emoji: "🔙" },
  HOMBROS: { id: "HOMBROS", label: "Hombros", emoji: "🏋️" },
  BICEPS: { id: "BICEPS", label: "Bíceps", emoji: "💪" },
  TRICEPS: { id: "TRICEPS", label: "Tríceps", emoji: "💪" },
  PIERNAS: { id: "PIERNAS", label: "Piernas", emoji: "🦵" },
  GLUTEOS: { id: "GLUTEOS", label: "Glúteos", emoji: "🍑" },
  ABDOMEN: { id: "ABDOMEN", label: "Abdomen", emoji: "🎯" },
  CARDIO: { id: "CARDIO", label: "Cardio", emoji: "❤️" },
  FULL_BODY: { id: "FULL_BODY", label: "Cuerpo completo", emoji: "⚡" },
  OTRO: { id: "OTRO", label: "Otro", emoji: "📌" }
};

// Meals Enums
export const MealType = {
  DESAYUNO: { id: "DESAYUNO", label: "Desayuno", emoji: "🌅", sortOrder: 0 },
  ALMUERZO: { id: "ALMUERZO", label: "Almuerzo", emoji: "☀️", sortOrder: 1 },
  MERIENDA: { id: "MERIENDA", label: "Merienda", emoji: "🍎", sortOrder: 2 },
  CENA: { id: "CENA", label: "Cena", emoji: "🌙", sortOrder: 3 },
  SNACK: { id: "SNACK", label: "Snack", emoji: "🍫", sortOrder: 4 }
};

export const IngredientCategory = {
  CARNE: { id: "CARNE", label: "Carne", emoji: "🥩" },
  PESCADO: { id: "PESCADO", label: "Pescado", emoji: "🐟" },
  VEGETAL: { id: "VEGETAL", label: "Vegetal", emoji: "🥦" },
  FRUTA: { id: "FRUTA", label: "Fruta", emoji: "🍎" },
  LACTEO: { id: "LACTEO", label: "Lácteo", emoji: "🥛" },
  CEREAL: { id: "CEREAL", label: "Cereal", emoji: "🌾" },
  LEGUMBRE: { id: "LEGUMBRE", label: "Legumbre", emoji: "🫘" },
  GRASA: { id: "GRASA", label: "Grasa/Aceite", emoji: "🫙" },
  ESPECIA: { id: "ESPECIA", label: "Especia", emoji: "🌿" },
  BEBIDA: { id: "BEBIDA", label: "Bebida", emoji: "🧃" },
  OTRO: { id: "OTRO", label: "Otro", emoji: "📦" }
};

// Savings Enums
export const TransactionType = {
  INCOME: { id: "INCOME", label: "Ingreso", emoji: "📈" },
  EXPENSE: { id: "EXPENSE", label: "Gasto", emoji: "📉" }
};

export const TransactionCategory = {
  SALARIO: { id: "SALARIO", label: "Salario", emoji: "💼", type: "INCOME" },
  FREELANCE: { id: "FREELANCE", label: "Freelance", emoji: "💻", type: "INCOME" },
  INVERSION: { id: "INVERSION", label: "Inversión", emoji: "📊", type: "INCOME" },
  REGALO: { id: "REGALO", label: "Regalo", emoji: "🎁", type: "INCOME" },
  OTRO_INGRESO: { id: "OTRO_INGRESO", label: "Otro ingreso", emoji: "💰", type: "INCOME" },
  
  ALIMENTACION: { id: "ALIMENTACION", label: "Alimentación", emoji: "🛒", type: "EXPENSE" },
  TRANSPORTE: { id: "TRANSPORTE", label: "Transporte", emoji: "🚗", type: "EXPENSE" },
  SUMINISTROS: { id: "SUMINISTROS", label: "Suministros", emoji: "🔌", type: "EXPENSE" },
  ALQUILER: { id: "ALQUILER", label: "Alquiler", emoji: "🏠", type: "EXPENSE" },
  OCIO: { id: "OCIO", label: "Ocio", emoji: "🎬", type: "EXPENSE" },
  BEBIDA: { id: "BEBIDA", label: "Bebida", emoji: "🍹", type: "EXPENSE" },
  TABACO: { id: "TABACO", label: "Tabaco", emoji: "🚬", type: "EXPENSE" },
  ROPA: { id: "ROPA", label: "Ropa", emoji: "👕", type: "EXPENSE" },
  SALUD: { id: "SALUD", label: "Salud", emoji: "🏥", type: "EXPENSE" },
  SUSCRIPCION: { id: "SUSCRIPCION", label: "Suscripción", emoji: "📱", type: "EXPENSE" },
  HOGAR: { id: "HOGAR", label: "Hogar", emoji: "🏠", type: "EXPENSE" },
  EDUCACION: { id: "EDUCACION", label: "Educación", emoji: "📚", type: "EXPENSE" },
  VIAJE: { id: "VIAJE", label: "Viaje", emoji: "✈️", type: "EXPENSE" },
  RESTAURANTE: { id: "RESTAURANTE", label: "Restaurante", emoji: "🍽️", type: "EXPENSE" },
  OTRO_GASTO: { id: "OTRO_GASTO", label: "Otro gasto", emoji: "💸", type: "EXPENSE" }
};

// Schedule Enums
export const ScheduleCategory = {
  TRABAJO: { id: "TRABAJO", label: "Trabajo", emoji: "💼", color: "#6366f1" },
  RUTINA: { id: "RUTINA", label: "Rutina", emoji: "🔄", color: "#8b5cf6" },
  DESCANSO: { id: "DESCANSO", label: "Descanso", emoji: "😴", color: "#334155" },
  COMIDA: { id: "COMIDA", label: "Comida", emoji: "🍽️", color: "#f59e0b" },
  GYM: { id: "GYM", label: "Gym", emoji: "💪", color: "#ef4444" },
  ESTUDIO: { id: "ESTUDIO", label: "Estudio", emoji: "📚", color: "#06b6d4" },
  PERSONAL: { id: "PERSONAL", label: "Personal", emoji: "👤", color: "#ec4899" },
  OTRO: { id: "OTRO", label: "Otro", emoji: "📌", color: "#94a3b8" }
};
