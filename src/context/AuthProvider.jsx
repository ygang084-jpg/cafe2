import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, hasSupabaseEnv } from '@/lib/supabase'

const AuthContext = createContext(null)

// 이메일/비밀번호 인증 상태를 앱 전체에 공급.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    // 새로고침 후에도 로그인 유지: 현재 세션 복원
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    // 로그인/로그아웃 시 상태 갱신
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signUp(email, password) {
    if (!supabase) throw new Error('Supabase 환경변수(.env)가 설정되지 않았습니다.')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  async function signIn(email, password) {
    if (!supabase) throw new Error('Supabase 환경변수(.env)가 설정되지 않았습니다.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  const value = { user, loading, signUp, signIn, signOut, hasSupabaseEnv }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
