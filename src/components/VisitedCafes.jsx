import { useEffect, useState } from 'react'
import { fetchVisitedCafes } from '@/lib/cafeNotes'
import { Button } from '@/components/ui/button'

// F5. 방문 체크한 내 카페만 모아보는 패널.
// - 엑셀 업로드와 무관하게, 로그인만 되어 있으면 DB(visit_notes)에서 직접 불러온다.
// - RLS 덕분에 로그인한 본인의 visited=true 기록만 조회된다.
// - 항목 클릭 → onSelectCafe(cafe)로 지도 중심 이동.
export default function VisitedCafes({ isLoggedIn, refreshKey, onSelectCafe, onRequireLogin }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (!isLoggedIn) {
      setItems([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    fetchVisitedCafes()
      .then((rows) => {
        if (!cancelled) setItems(rows)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isLoggedIn, refreshKey])

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-gray-900">
        ☕ 방문한 카페{isLoggedIn && <span className="text-gray-400"> ({items.length})</span>}
      </h2>

      {!isLoggedIn ? (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          <p>로그인하면 방문한 카페를 모아볼 수 있어요.</p>
          {onRequireLogin && (
            <Button variant="outline" className="mt-2 w-full" onClick={onRequireLogin}>
              로그인하기
            </Button>
          )}
        </div>
      ) : loading ? (
        <p className="text-sm text-gray-400">불러오는 중…</p>
      ) : error ? (
        <p className="text-sm text-red-600">불러오지 못했어요: {error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">
          아직 방문 체크한 카페가 없어요. 마커를 눌러 방문을 기록해 보세요.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((cafe) => (
            <li key={`${cafe.name}||${cafe.address}`}>
              <button
                type="button"
                onClick={() => onSelectCafe?.(cafe)}
                disabled={cafe.lat == null || cafe.lng == null}
                className="w-full rounded-lg border border-gray-100 p-3 text-left transition hover:bg-gray-50 disabled:cursor-default disabled:hover:bg-white"
                title={cafe.lat == null ? '좌표가 없어 지도 이동이 불가해요' : '지도에서 이 카페로 이동'}
              >
                <p className="font-medium text-gray-900">{cafe.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">{cafe.address}</p>
                <p className="mt-1 text-sm text-gray-700">
                  {cafe.memo ? `“${cafe.memo}”` : <span className="text-gray-300">소감 없음</span>}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
