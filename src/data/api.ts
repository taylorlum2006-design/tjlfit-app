import type { Call, CallPrivate, CallSummary, DailyCheckin, Doc, Photo, Plan, Profile, WeeklyCheckin } from '../types'

export interface Api {
  mode: 'demo' | 'live'
  currentUserId(): Promise<string | null>
  onAuthChange(cb: () => void): () => void
  signIn(email: string): Promise<void>
  verifyCode(email: string, code: string): Promise<void>
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
  listCalls(clientId: string): Promise<Call[]>
  saveCall(call: Call): Promise<void>
  deleteCall(id: string): Promise<void>
  getCallPrivate(callId: string): Promise<CallPrivate | null>
  saveCallPrivate(row: CallPrivate): Promise<void>
  summarize(transcript: string, clientName: string): Promise<CallSummary>
  listDocs(clientId: string): Promise<Doc[]>
  uploadDoc(clientId: string, title: string, file: File, visible: boolean): Promise<void>
  updateDoc(id: string, patch: Partial<Pick<Doc, 'title' | 'client_visible'>>): Promise<void>
  deleteDoc(doc: Doc): Promise<void>
}

export const emptySummary = (): CallSummary => ({ summary: '', decisions: [], wins: [], concerns: [], action_items: [] })

export function emptyDaily(clientId: string, date: string): DailyCheckin {
  return { client_id: clientId, date, weight: null, rested: null, train_desire: null, digestion: '', untracked_food: '', steps: null, water: null, goals_done: [], supplements_taken: [], submitted: false }
}

export function emptyPlan(clientId: string): Plan {
  return { client_id: clientId, phase: 'Phase 1', coach_note: '', meals: [], supplements: [], goals: [], step_goal: 10000, water_goal: 3, photos_enabled: true, updated_at: new Date().toISOString() }
}
