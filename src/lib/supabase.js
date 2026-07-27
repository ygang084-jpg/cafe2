import { createClient } from '@supabase/supabase-js'

// 값은 .env(VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)에서 읽는다.
// 코드에는 실제 키를 절대 하드코딩하지 않는다.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseEnv = Boolean(url && anonKey)

// 환경변수가 없으면 앱이 죽지 않도록 null로 둔다(지도 조회는 계속 가능).
export const supabase = hasSupabaseEnv ? createClient(url, anonKey) : null
