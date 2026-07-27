// 방문 현황 요약 파생 계산 (PRD F6).
// 읽기 전용: 새 API/DB 쿼리 없이, 화면이 이미 든 카페 목록만으로 센다.
//  - total(분모): 지도에 표시 중인 카페 수 = 지오코딩 성공분(실패 목록은 애초에 제외됨).
//  - visited(분자): 그중 로그인 사용자의 기록이 덧입혀져 visited === true 인 수.
// 매칭 키(이름+주소)는 App에서 목록에 덧입힐 때 이미 적용되므로 여기선 visited 값만 센다.
export function getVisitSummary(cafes) {
  const list = Array.isArray(cafes) ? cafes : []
  const total = list.length
  const visited = list.filter((cafe) => cafe.visited === true).length
  return { total, visited }
}
