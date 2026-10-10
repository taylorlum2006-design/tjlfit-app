import { demoApi } from './demo'
import { supabaseApi } from './supabase'
import type { Api } from './api'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// With Supabase keys set, the app runs live. Without them, it runs in demo mode in the browser.
export const api: Api = url && key ? supabaseApi(url, key) : demoApi
export { demoApi }
