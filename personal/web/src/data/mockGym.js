import { MuscleGroup } from '../models/enums';

export const mockRoutines = [
  {
    id: 'r1',
    name: 'Empuje (Pecho/Hombro/Tríceps)',
    dayOfWeek: 'Lunes',
    description: 'Enfoque en fuerza e hipertrofia de empuje',
    targetMuscles: [MuscleGroup.PECHO, MuscleGroup.HOMBROS, MuscleGroup.TRICEPS],
    exercises: [
      {
        name: 'Press de Banca con Barra',
        reps: '8-10',
        sets: 4,
        weight: 80,
        muscleGroup: MuscleGroup.PECHO,
        restSeconds: 120,
        notes: 'Controlar el descenso'
      },
      {
        name: 'Press Militar Mancuernas',
        reps: '10-12',
        sets: 3,
        weight: 22.5,
        muscleGroup: MuscleGroup.HOMBROS,
        restSeconds: 90,
        notes: 'Sin balanceo'
      },
      {
        name: 'Extensiones de Tríceps Polea',
        reps: '12-15',
        sets: 3,
        weight: 25,
        muscleGroup: MuscleGroup.TRICEPS,
        restSeconds: 60,
        notes: 'Codos pegados al cuerpo'
      }
    ]
  },
  {
    id: 'r2',
    name: 'Tracción (Espalda/Bíceps)',
    dayOfWeek: 'Martes',
    description: 'Enfoque en densidad de espalda',
    targetMuscles: [MuscleGroup.ESPALDA, MuscleGroup.BICEPS],
    exercises: [
      {
        name: 'Dominadas',
        reps: 'Al fallo',
        sets: 3,
        weight: 0,
        muscleGroup: MuscleGroup.ESPALDA,
        restSeconds: 120,
        notes: 'Rango completo'
      },
      {
        name: 'Remo con Barra',
        reps: '10',
        sets: 4,
        weight: 60,
        muscleGroup: MuscleGroup.ESPALDA,
        restSeconds: 90,
        notes: 'Mantener espalda recta'
      }
    ]
  }
];

export const mockHistory = [
  {
    id: 'h1',
    routineName: 'Empuje (Pecho/Hombro/Tríceps)',
    date: '2026-04-20',
    durationMinutes: 65,
    totalVolume: 2450,
    completedSets: 10
  }
];
