import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { saveCafeNote, getCafeNote, AuthRequiredError } from '@/lib/cafeNotes'

// 마커 클릭 시 뜨는 방문 기록 팝업 (shadcn/ui Dialog).
// - 조회는 로그인 없이 가능(지도/마커). 저장만 로그인 필요.
// - 로그인 상태면 팝업이 열릴 때 저장돼 있던 본인 기록을 불러와 채운다 (F4).
// - 저장은 upsert → 같은 카페를 다시 저장해도 새 행이 아니라 기존 행이 갱신된다.
export default function VisitDialog({ cafe, open, onOpenChange, isLoggedIn, onRequireLogin, onSaved }) {
  const [visited, setVisited] = useState(false)
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false) // 이전 기록 불러오는 중
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'error'|'info'|'success', text }

  // 팝업이 열리거나 다른 카페를 고르면: 저장돼 있던 본인 기록을 불러와 채운다.
  useEffect(() => {
    let cancelled = false
    setMessage(null)

    if (!cafe || !open) return

    // 비로그인: 조회는 가능하되 저장된 개인 기록은 없음 → 빈 값으로 시작
    if (!isLoggedIn) {
      setVisited(false)
      setMemo('')
      return
    }

    setLoading(true)
    getCafeNote({ name: cafe.name, address: cafe.address })
      .then((note) => {
        if (cancelled) return
        setVisited(Boolean(note?.visited))
        setMemo(note?.memo ?? '')
      })
      .catch((err) => {
        if (cancelled) return
        setVisited(false)
        setMemo('')
        // 세션 만료 등 → 에러 화면 대신 안내
        if (err instanceof AuthRequiredError) {
          setMessage({ type: 'info', text: '로그인이 풀렸어요. 다시 로그인하면 예전 기록을 볼 수 있어요.' })
        } else {
          setMessage({ type: 'error', text: '기록을 불러오지 못했어요: ' + err.message })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [cafe, open, isLoggedIn])

  async function handleSave() {
    setMessage(null)
    setSaving(true)
    try {
      await saveCafeNote({
        name: cafe.name,
        address: cafe.address,
        lat: cafe.lat,
        lng: cafe.lng,
        visited,
        memo,
      })
      // 지도/목록 오버레이를 즉시 갱신 (다시 열지 않아도 방문 배지·소감 반영)
      onSaved?.({ name: cafe.name, address: cafe.address, visited, memo })
      onOpenChange(false) // 저장 성공 → 닫기 (다시 열면 upsert된 기록이 채워짐)
    } catch (err) {
      // 로그인이 풀린 경우: 에러 화면 대신 안내 + 로그인 유도
      if (err instanceof AuthRequiredError) {
        setMessage({ type: 'info', text: '로그인이 풀렸어요. 다시 로그인한 뒤 저장해 주세요.' })
        onRequireLogin?.()
      } else {
        setMessage({ type: 'error', text: '저장에 실패했어요: ' + err.message })
      }
    } finally {
      setSaving(false)
    }
  }

  if (!cafe) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{cafe.name}</DialogTitle>
          <DialogDescription>{cafe.address}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {loading && <p className="text-sm text-emerald-700">이전 기록을 불러오는 중…</p>}

          <div className="flex items-center gap-2">
            <Checkbox
              id="visited"
              checked={visited}
              disabled={!isLoggedIn || loading || saving}
              onCheckedChange={(v) => setVisited(v === true)}
            />
            <Label htmlFor="visited">방문했어요</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">한줄 소감</Label>
            <Textarea
              id="memo"
              placeholder={isLoggedIn ? '이 카페 어땠나요?' : '로그인하면 소감을 남길 수 있어요.'}
              value={memo}
              disabled={!isLoggedIn || loading || saving}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          {message && (
            <p
              className={
                message.type === 'error'
                  ? 'text-sm text-red-600'
                  : message.type === 'success'
                    ? 'text-sm text-emerald-700'
                    : 'text-sm text-amber-700'
              }
            >
              {message.text}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {isLoggedIn ? (
            <Button type="button" onClick={handleSave} disabled={saving || loading} className="w-full">
              {saving ? '저장 중…' : '저장'}
            </Button>
          ) : (
            <div className="w-full space-y-2 rounded-md bg-amber-50 p-3 text-center text-sm text-amber-800">
              <p>소감을 저장하려면 로그인이 필요해요.</p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  onOpenChange(false)
                  onRequireLogin?.()
                }}
              >
                로그인하기
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
