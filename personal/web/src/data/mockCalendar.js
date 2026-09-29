import { EventCategory, EventPriority, ScheduleCategory } from '../models/enums';

export const mockEvents = [
  {
    id: '1',
    title: 'Reunión Proyecto Web',
    description: 'Sincronización de tareas del equipo',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:30',
    category: EventCategory.TRABAJO,
    isCompleted: false,
    priority: EventPriority.HIGH
  },
  {
    id: '2',
    title: 'Entrenamiento Full Body',
    description: 'Día de fuerza pesada',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '19:30',
    category: EventCategory.GYM,
    isCompleted: true,
    priority: EventPriority.MEDIUM
  }
];

export const mockScheduleBlocks = [
  {
    id: 'b1',
    title: 'Descanso / Sueño',
    startTime: '00:00',
    endTime: '08:00',
    category: ScheduleCategory.DESCANSO,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    color: '#334155'
  },
  {
    id: 'b2',
    title: 'Trabajo Concentrado',
    startTime: '09:00',
    endTime: '14:00',
    category: ScheduleCategory.TRABAJO,
    daysOfWeek: [1, 2, 3, 4, 5],
    color: '#6366f1'
  },
  {
    id: 'b3',
    title: 'Comida',
    startTime: '14:00',
    endTime: '15:00',
    category: ScheduleCategory.COMIDA,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    color: '#f59e0b'
  }
];
