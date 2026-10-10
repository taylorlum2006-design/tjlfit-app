import type { DailyCheckin, Photo, Plan, Profile, WeeklyCheckin } from '../types'

export interface Api {
  mode: 'demo' | 'live'
  currentUserId(): Promise<string | null>
  onAuthChange(cb: () => void): () => void
  signIn(email: string): Promise<void>
  signOut(): Promise<void>
  getProfile(id: string): Promise<Profile | null>
  updateProfile(id: string, patch: Partial<Profile>): Promise<void>
  listClients(coachId: string): Promise<Profile[]>
  getPlan(clientId: string): Promise<Plan | null>
  savePlan(plan: Plan): Promise<void>
  listDaily(clientId: string): Promise<DailyCheckin[]>
  saveDaily(row: DailyCheckin): Promise<void>
  listWeekly(clientId: string): Promise<WeeklyCheckin[]>
  saveWeekly(row: WeeklyCheckin): Promise<void>
  listPhotos(clientId: string): Promise<Photo[]>
  uploadPhoto(clientId: string, date: string, angle: Photo['angle'], blob: Blob): Promise<void>
  inviteClient(email: string, name: string): Promise<void>
}

export function emptyDaily(clientId: string, date: string): DailyCheckin {
  return { client_id: clientId, date, weight: null, rested: null, train_desire: null, digestion: '', untracked_food: '', steps: null, water: null, goals_done: [], supplements_taken: [], submitted: false }
}

export function emptyPlan(clientId: string): Plan {
  return { client_id: clientId, phase: 'Phase 1', coach_note: '', meals: [], supplements: [], goals: [], step_goal: 10000, water_goal: 3, photos_enabled: true, updated_at: new Date().toISOString() }
}
