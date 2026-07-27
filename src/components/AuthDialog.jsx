import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthProvider'

// 로그인 / 회원가입 폼 (shadcn Dialog).
export default function AuthDialog({ open, onOpenChange }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null) // { type: 'error'|'info', text }
  const [busy, setBusy] = useState(false)

  const isLogin = mode === 'login'

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)
    setBusy(true)
    try {
      if (isLogin) {
        await signIn(email, password)
        close()
      } else {
        const data = await signUp(email, password)
        // 이메일 확인이 켜져 있으면 세션 없이 생성됨 → 안내
        if (data.session) {
          close()
        } else {
          setMessage({
            type: 'info',
            text: '회원가입 완료! 이메일 확인이 필요한 설정이면 메일의 링크를 눌러 인증한 뒤 로그인하세요.',
          })
          setMode('login')
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  function close() {
    setEmail('')
    setPassword('')
    setMessage(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isLogin ? '로그인' : '회원가입'}</DialogTitle>
          <DialogDescription>
            이메일과 비밀번호로 {isLogin ? '로그인하세요.' : '가입하세요.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
            />
          </div>

          {message && (
            <p
              className={
                message.type === 'error'
                  ? 'text-sm text-red-600'
                  : 'text-sm text-emerald-700'
              }
            >
              {message.text}
            </p>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? '처리 중…' : isLogin ? '로그인' : '회원가입'}
            </Button>
            <button
              type="button"
              onClick={() => {
                setMode(isLogin ? 'signup' : 'login')
                setMessage(null)
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {isLogin ? '계정이 없나요? 회원가입' : '이미 계정이 있나요? 로그인'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
