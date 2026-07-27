import { useEffect, useRef } from 'react'
import { loadKakaoMapSdk, hasKakaoKey } from '../lib/kakaoMap'
import { SEOUL_CITY_HALL } from '../data/mockCafes'

// 방문/미방문 마커 색 (PRD F7). 범례(VisitSummary)의 색 점과 반드시 같은 값을 쓴다.
//  - 방문 완료: 짙은 에메랄드 + 흰색 체크(색약 대비: 색뿐 아니라 형태로도 구분)
//  - 미방문:    대비되는 앰버 + 흰색 점
const VISITED_COLOR = '#059669' // emerald-600
const UNVISITED_COLOR = '#f59e0b' // amber-500

// 외부 CDN 의존 없이 동작하도록 색만 다른 핀 SVG를 data URI로 인라인한다.
function pinSvg(color, kind) {
  const inner =
    kind === 'visited'
      ? '<path d="M9 14.5l3.3 3.3 6.4-6.8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
      : '<circle cx="14" cy="14" r="4.2" fill="#fff"/>'
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">' +
    '<path d="M14 1C6.8 1 1 6.8 1 14c0 8.9 11.7 21 12.2 21.5a1.1 1.1 0 0 0 1.6 0C15.3 35 27 22.9 27 14 27 6.8 21.2 1 14 1z" ' +
    `fill="${color}" stroke="#ffffff" stroke-width="1.6"/>` +
    inner +
    '</svg>'
  )
}

// 지도 영역. 카페 마커를 찍고, 마커 클릭 시 방문 기록 팝업을 연다(onSelectCafe).
// 규칙: 마커를 다시 그릴 때는 이전 마커를 모두 지운 뒤 새로 그린다(겹침 방지).
export default function CafeMap({ cafes, onSelectCafe, focusCafe }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const markerImagesRef = useRef(null) // 방문/미방문 MarkerImage 2개만 만들어 재사용
  const onSelectRef = useRef(onSelectCafe)

  // MarkerImage는 마커마다 새로 만들지 않고 방문/미방문 2개만 만들어 캐시한다.
  function getMarkerImages(kakao) {
    if (markerImagesRef.current) return markerImagesRef.current
    const size = new kakao.maps.Size(28, 38)
    const offset = new kakao.maps.Point(14, 37) // 핀 끝(하단 중앙)이 좌표에 오도록
    const make = (color, kind) =>
      new kakao.maps.MarkerImage(
        'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pinSvg(color, kind)),
        size,
        { offset },
      )
    markerImagesRef.current = {
      visited: make(VISITED_COLOR, 'visited'),
      unvisited: make(UNVISITED_COLOR, 'unvisited'),
    }
    return markerImagesRef.current
  }

  // 최신 콜백을 ref에 유지 (마커 리스너가 오래된 콜백을 잡지 않도록)
  useEffect(() => {
    onSelectRef.current = onSelectCafe
  }, [onSelectCafe])

  // 이전 마커 전부 제거
  function clearMarkers() {
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []
  }

  // 지운 뒤 새로 그린다
  function renderCafeMarkers(list) {
    const kakao = window.kakao
    if (!kakao || !mapRef.current) return

    clearMarkers()

    const images = getMarkerImages(kakao)
    const bounds = new kakao.maps.LatLngBounds()

    list.forEach((cafe) => {
      if (cafe.lat == null || cafe.lng == null) return
      const position = new kakao.maps.LatLng(cafe.lat, cafe.lng)
      // 방문 판정은 App이 덧입힌 visited 값만 사용 (F6과 동일 기준). 비로그인은 전부 미방문.
      const isVisited = cafe.visited === true
      const marker = new kakao.maps.Marker({
        position,
        title: isVisited ? `${cafe.name} (방문 완료)` : cafe.name,
        image: isVisited ? images.visited : images.unvisited,
      })
      marker.setMap(mapRef.current)

      // 마커 클릭 → 방문 기록 팝업 열기
      kakao.maps.event.addListener(marker, 'click', () => {
        onSelectRef.current?.(cafe)
      })

      markersRef.current.push(marker)
      bounds.extend(position)
    })

    // 마커가 있으면 전부 보이도록 지도 범위 맞추기
    if (markersRef.current.length > 0) {
      mapRef.current.setBounds(bounds)
    }
  }

  // 지도 최초 생성 (SDK 로드 완료 후)
  useEffect(() => {
    let cancelled = false
    loadKakaoMapSdk()
      .then((kakao) => {
        if (cancelled || !containerRef.current) return
        mapRef.current = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(SEOUL_CITY_HALL.lat, SEOUL_CITY_HALL.lng),
          level: 5,
        })
        renderCafeMarkers(cafes)
      })
      .catch((err) => console.warn('[CafeMap]', err.message))

    return () => {
      cancelled = true
      clearMarkers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // cafes가 바뀌면 마커 다시 그리기 (이전 마커는 clearMarkers로 제거됨)
  useEffect(() => {
    renderCafeMarkers(cafes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafes])

  // 목록에서 카페를 고르면 지도 중심을 그 위치로 이동 (F5).
  // 같은 항목을 다시 눌러도 반응하도록 App이 매번 새 객체를 넘긴다.
  useEffect(() => {
    const kakao = window.kakao
    if (!focusCafe || focusCafe.lat == null || focusCafe.lng == null) return
    if (!kakao || !mapRef.current) return
    const pos = new kakao.maps.LatLng(focusCafe.lat, focusCafe.lng)
    mapRef.current.setLevel(3)
    mapRef.current.panTo(pos)
  }, [focusCafe])

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
      <div ref={containerRef} className="h-full w-full" />

      {!hasKakaoKey && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-gray-500">
            지도를 보려면 <code className="rounded bg-gray-200 px-1">.env</code>의{' '}
            <code className="rounded bg-gray-200 px-1">VITE_KAKAO_MAP_KEY</code>를 설정하세요.
          </p>
        </div>
      )}
    </div>
  )
}
