// 주소→좌표 변환 계층.
// 규칙(CLAUDE.md):
//  - 하나씩 순서대로(순차) 변환하고, 못 찾은 주소는 화면에 목록으로 안내한다.
//  - 이미 변환한 주소는 캐싱해 재변환하지 않는다(카카오 쿼터 절약).

import { loadKakaoMapSdk } from './kakaoMap'

// 단일 주소 변환. 성공 시 { lat, lng }, 실패 시 null.
export async function geocodeAddress(address) {
  const kakao = await loadKakaoMapSdk()
  const geocoder = new kakao.maps.services.Geocoder()

  return new Promise((resolve) => {
    geocoder.addressSearch(address, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) })
      } else {
        resolve(null)
      }
    })
  })
}

// 카페 목록을 하나씩 순차 변환해 { located, failed }로 나눈다.
// located: 좌표(lat/lng)가 채워진 카페, failed: 주소를 못 찾은 카페.
export async function geocodeCafes(cafes) {
  const located = []
  const failed = []
  const cache = new Map() // 주소 → { lat, lng } (같은 파일 내 중복 주소 재변환 방지)

  for (const cafe of cafes) {
    const key = cafe.address
    let coord = cache.get(key)
    if (coord === undefined) {
      coord = await geocodeAddress(key) // 순차 처리 (await로 한 번에 하나씩)
      cache.set(key, coord)
    }

    if (coord) {
      located.push({ ...cafe, lat: coord.lat, lng: coord.lng })
    } else {
      failed.push(cafe)
    }
  }

  return { located, failed }
}
