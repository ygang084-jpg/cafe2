import { useState, useEffect, useMemo } from 'react'
import Header from './components/Header'
import CafeMap from './components/CafeMap'
import CafeList from './components/CafeList'
import FailedList from './components/FailedList'
import VisitSummary from './components/VisitSummary'
import VisitedCafes from './components/VisitedCafes'
import VisitDialog from './components/VisitDialog'
import AuthDialog from './components/AuthDialog'
import OfflineNotice from './components/OfflineNotice'
import { useAuth } from './context/AuthProvider'
import { parseCafeExcel } from './lib/excel'
import { geocodeCafes } from './lib/geocode'
import { fetchMyNotes, noteKey } from './lib/cafeNotes'

export default function App() {
  const { user, signOut } = useAuth()
  const [cafes, setCafes] = useState([]) // 좌표까지 채워진 카페 (지도/목록에 표시)
  const [failedCafes, setFailedCafes] = useState([]) // 주소를 못 찾은 카페
  const [loading, setLoading] = useState(false)
  const [selectedCafe, setSelectedCafe] = useState(null) // 팝업에 띄울 카페
  const [dialogOpen, setDialogOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false) // 로그인/회원가입 팝업
  const [notes, setNotes] = useState({}) // 저장된 내 소감: noteKey(이름+주소) → { visited, memo }
  const [focusCafe, setFocusCafe] = useState(null) // 목록에서 고른 카페(지도 중심 이동용)
  const [visitedVersion, setVisitedVersion] = useState(0) // "방문한 카페" 목록 새로고침 트리거

  // 로그인하면 저장해 둔 내 소감을 불러와 지도/목록에 덧입힌다.
  // 로그아웃하면 개인 기록 오버레이를 비운다(비로그인은 방문 상태가 보이지 않음).
  useEffect(() => {
    let cancelled = false
    if (!user) {
      setNotes({})
      return
    }
    fetchMyNotes()
      .then((rows) => {
        if (cancelled) return
        const map = {}
        for (const r of rows) map[noteKey(r.name, r.address)] = { visited: r.visited, memo: r.memo }
        setNotes(map)
      })
      .catch((err) => {
        if (!cancelled) console.warn('[App] 내 소감 불러오기 실패:', err.message)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  // 화면에 표시할 카페 = 엑셀 카페에 저장된 방문 여부·소감을 덧입힌 것.
  const displayedCafes = useMemo(
    () =>
      cafes.map((cafe) => {
        const note = notes[noteKey(cafe.name, cafe.address)]
        return note ? { ...cafe, visited: note.visited, memo: note.memo } : cafe
      }),
    [cafes, notes],
  )

  // 소감 저장 성공 시 오버레이를 즉시 갱신 → 팝업을 다시 열지 않아도 지도/목록에 반영.
  // "방문한 카페" 목록도 다시 불러오도록 버전을 올린다.
  function handleNoteSaved({ name, address, visited, memo }) {
    setNotes((prev) => ({ ...prev, [noteKey(name, address)]: { visited, memo } }))
    setVisitedVersion((v) => v + 1)
  }

  // "방문한 카페" 목록 항목 클릭 → 지도 중심 이동. 같은 항목을 다시 눌러도
  // 반응하도록 매번 새 객체를 만들어 넘긴다(참조가 달라져 지도 effect가 재실행).
  function handleFocusCafe(cafe) {
    setFocusCafe({ ...cafe })
  }

  // 마커 클릭 → 방문 기록 팝업 열기 (로그인 없이도 조회 가능)
  function handleSelectCafe(cafe) {
    setSelectedCafe(cafe)
    setDialogOpen(true)
  }

  // 소감 저장 등 로그인이 필요한 지점에서 호출
  function requireLogin() {
    setAuthOpen(true)
  }

  // F1 + F2: 엑셀 업로드 → 목록 파싱 → 순차 지오코딩 → 마커 표시
  async function handleExcelUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = '' // 같은 파일 다시 선택 가능하도록 초기화

    setLoading(true)
    try {
      const parsed = await parseCafeExcel(file)
      if (parsed.length === 0) {
        alert('읽을 수 있는 카페가 없어요. 첫 줄 제목이 "이름/주소/카테고리"인지 확인해 주세요.')
        return
      }
      // 재업로드 시 이전 결과를 완전히 대체 (마커가 쌓이지 않게)
      const { located, failed } = await geocodeCafes(parsed)
      setCafes(located)
      setFailedCafes(failed)
    } catch (err) {
      console.error(err)
      alert('엑셀 처리 중 오류가 발생했어요: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <OfflineNotice />
      <Header
        user={user}
        onExcelUpload={handleExcelUpload}
        onLogin={() => setAuthOpen(true)}
        onLogout={signOut}
      />

      <main className="mx-auto max-w-5xl px-4 py-6">
        {loading && (
          <p className="mb-3 text-sm text-emerald-700">주소를 좌표로 변환하는 중…</p>
        )}

        {/* F6: 방문 현황 요약 ("총 ○곳 중 ○곳 방문 완료") — 지도 위 상단, 파생 계산 */}
        <VisitSummary cafes={displayedCafes} />

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CafeMap
              cafes={displayedCafes}
              onSelectCafe={handleSelectCafe}
              focusCafe={focusCafe}
            />
            <FailedList failedCafes={failedCafes} />
          </div>

          {/* F5: 방문한 카페 모아보기 (엑셀 없이도, 로그인만 되면 표시) */}
          <aside className="lg:col-span-1">
            <VisitedCafes
              isLoggedIn={Boolean(user)}
              refreshKey={visitedVersion}
              onSelectCafe={handleFocusCafe}
              onRequireLogin={requireLogin}
            />
          </aside>
        </div>

        {cafes.length === 0 && failedCafes.length === 0 ? (
          <p className="mt-6 text-center text-sm text-gray-400">
            상단의 <span className="font-medium text-gray-600">엑셀 업로드</span> 버튼으로
            카페 목록(이름/주소/카테고리)을 올려보세요.
          </p>
        ) : (
          <CafeList cafes={displayedCafes} />
        )}
      </main>

      <VisitDialog
        cafe={selectedCafe}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isLoggedIn={Boolean(user)}
        onRequireLogin={requireLogin}
        onSaved={handleNoteSaved}
      />

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  )
}
