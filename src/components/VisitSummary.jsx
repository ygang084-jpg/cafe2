import { getVisitSummary } from '@/lib/visitSummary'

// 지도 상단 "총 ○곳 중 ○곳 방문 완료" 요약 배지 (PRD F6).
// cafes(지도에 표시 중인 목록)에서 파생 계산만 한다 — 별도 상태로 복제하지 않으므로
// 방문 저장 시 목록이 바뀌면 요약도 자동으로 즉시 갱신된다.
export default function VisitSummary({ cafes }) {
  const { total, visited } = getVisitSummary(cafes)

  // 빈 상태: 표시할 카페가 없으면 요약을 숨긴다.
  if (total === 0) return null

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800">
        <span aria-hidden="true">📍</span>
        총 <b className="font-semibold">{total}</b>곳 중{' '}
        <b className="font-semibold">{visited}</b>곳 방문 완료
      </span>

      {/* 지도 마커 색 범례 (F7). 점 색은 CafeMap의 마커 색과 반드시 동일해야 한다. */}
      <span className="inline-flex items-center gap-3 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: '#059669' }}
          />
          방문 완료
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: '#f59e0b' }}
          />
          미방문
        </span>
      </span>
    </div>
  )
}
