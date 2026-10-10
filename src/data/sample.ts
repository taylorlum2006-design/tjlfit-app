import type { Meal, Plan, Supplement, Goal } from '../types'

// Sample plan used in demo mode and as a starting template for new clients.
const i = (name: string, grams: number, kcal: number, p: number, c: number, f: number) => ({ name, grams, kcal, p, c, f })

export const sampleMeals: Meal[] = [
  { id: 'm1', name: 'Meal 1 · Pre-workout', note: 'About 2 hours before you lift. Eggs, oats and berries slow your stomach down, so give it time.', items: [
    i('Whole eggs (2 large)', 100, 142, 12.6, 0.7, 9.5),
    i('Egg whites', 160, 77, 17.4, 1.1, 0.3),
    i('Oats, dry weight', 100, 383, 13, 66, 7),
    i('Blueberries', 120, 76, 0.9, 17.4, 0.4),
  ] },
  { id: 'm2', name: 'Intra-workout', note: 'Mix into 1.5 L of water. Start sipping on your first working set, finish by your last.', items: [
    i('Cyclic dextrin (1 scoop)', 25, 96, 0, 24, 0),
    i('EAAs (1 scoop)', 10, 0, 0, 0, 0),
    i('Electrolytes (1 scoop)', 5, 0, 0, 0, 0),
  ] },
  { id: 'm3', name: 'Meal 2 · Post-workout', note: 'Within 30 minutes of your last set. Near-zero fat and fibre on purpose so it clears fast.', items: [
    i('Cream of rice, dry weight', 100, 362, 6, 80, 0.5),
    i('Whey isolate', 50, 187, 44, 1, 0.5),
    i('Mandarin (1 medium)', 90, 52, 0.7, 12, 0.3),
  ] },
  { id: 'm4', name: 'Meal 3 · Lunch', note: 'Midday, 2 to 3 hours after Meal 2.', items: [
    i('Chicken breast, raw weight', 130, 136, 29.4, 0, 1.6),
    i('Potato, raw weight', 315, 250, 6.3, 55, 0.3),
    i('Broccoli', 150, 61, 4, 10, 0.6),
  ] },
  { id: 'm5', name: 'Meal 4 · Dinner', note: 'No added cooking oil. Air-fry, bake or use a non-stick pan.', items: [
    i('Salmon, raw weight', 140, 194, 28, 0, 8.5),
    i('Potato, raw weight', 270, 214, 5.4, 47, 0.3),
    i('Broccoli', 150, 61, 4, 10, 0.6),
  ] },
  { id: 'm6', name: 'Meal 5 · Before bed', note: '60 to 90 minutes before sleep. The chocolate is in the plan, weigh it.', items: [
    i('Greek yogurt, 5% plain', 150, 146, 13.5, 6, 7.5),
    i('Frozen mixed berries', 70, 36, 0.5, 8, 0.2),
    i('Kiwi (1 medium, peeled)', 75, 51, 0.8, 11, 0.4),
    i('Almonds', 20, 124, 4.2, 4.3, 10),
    i('80% dark chocolate', 40, 222, 3.6, 9, 17.6),
  ] },
]

export const sampleSupplements: Supplement[] = [
  { id: 's1', name: 'Vitamin D3 + K2', dose: '3,000 IU D3', timing: 'With breakfast', note: 'After food, it needs fat to absorb. Look for MK-7 K2.' },
  { id: 's2', name: 'Omega-3', dose: '2 g', timing: 'With breakfast', note: 'Check the label for 1 to 2 g of EPA + DHA, not total oil.' },
  { id: 's3', name: 'Creatine monohydrate', dose: '5 g', timing: 'With breakfast', note: 'Every day, training or not. Consistency is the whole effect.' },
  { id: 's4', name: 'L-Glutamine', dose: '10 g', timing: 'With breakfast', note: 'Gut and recovery support at this training volume.' },
  { id: 's5', name: 'Hydrolysed collagen', dose: '1 serving', timing: 'Post-workout', note: 'For tendons and joints. Your whey is already counted in Meal 2. Collagen does not count toward protein.' },
  { id: 's6', name: 'Magnesium glycinate', dose: '500 mg', timing: 'Before bed', note: 'Glycinate, not oxide. About 60 minutes before bed.' },
  { id: 's7', name: 'Ashwagandha + L-Theanine', dose: '1 capsule', timing: 'Before bed', note: 'Cycle 8 to 12 weeks on, 4 off. Skip it with any thyroid or autoimmune condition and check with your doctor.' },
  { id: 's8', name: 'Glycine', dose: '5 g', timing: 'Before bed', note: 'Mix in water. Stacks with the magnesium for sleep depth.' },
]

export const sampleGoals: Goal[] = [
  { id: 'g1', text: 'Weigh in after the toilet, before food or water' },
  { id: 'g2', text: 'Hit every meal in the plan' },
  { id: 'g3', text: 'Drink your water target' },
  { id: 'g4', text: 'Hit your step goal' },
  { id: 'g5', text: 'Train as programmed' },
  { id: 'g6', text: 'Lights out by 11pm' },
]

export function samplePlan(clientId: string): Plan {
  return {
    client_id: clientId, phase: 'Phase 1', step_goal: 10000, water_goal: 4, photos_enabled: true,
    coach_note: 'Weigh in every morning under the same conditions. One day means nothing, the 7-day average is the number that gets read. Do not adjust anything yourself: log it, I read the trend, I move the number.',
    meals: sampleMeals, supplements: sampleSupplements, goals: sampleGoals, updated_at: new Date().toISOString(),
  }
}
