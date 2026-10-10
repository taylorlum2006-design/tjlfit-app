export type Role = 'coach' | 'client'

export interface Profile {
  id: string
  role: Role
  coach_id: string | null
  name: string
  email: string
  timezone: string
  units: 'lbs' | 'kg'
  start_date: string
  daily_reminder_time: string // "08:00"
  weekly_checkin_day: number // 0 = Sunday
}

export interface Ingredient { name: string; grams: number; kcal: number; p: number; c: number; f: number }
export interface Meal {
  id: string
  name: string
  note?: string
  days?: number[] // weekdays this meal applies to (0 = Sunday). Empty = every day
  group?: string // meals sharing a group are alternatives ("pick one")
  items: Ingredient[]
}
export interface Supplement { id: string; name: string; dose: string; timing: string; note?: string }
export interface Goal { id: string; text: string }

export interface Plan {
  client_id: string
  phase: string
  coach_note: string
  meals: Meal[]
  supplements: Supplement[]
  goals: Goal[]
  step_goal: number
  water_goal: number // litres
  photos_enabled: boolean
  updated_at: string
}

export interface DailyCheckin {
  client_id: string
  date: string // YYYY-MM-DD in client's timezone
  weight: number | null
  rested: boolean | null
  train_desire: number | null
  digestion: string
  untracked_food: string
  steps: number | null
  water: number | null
  goals_done: string[]
  supplements_taken: string[]
  submitted: boolean
}

export interface WeeklyCheckin {
  client_id: string
  week_start: string // Monday YYYY-MM-DD
  weight: number | null
  body_fat: number | null
  energy: number
  sleep: number
  win: string
  improve: string
  notes: string
  prep: Record<string, string>
}

export interface Photo { id: string; client_id: string; date: string; angle: 'front' | 'side' | 'back'; url: string }
