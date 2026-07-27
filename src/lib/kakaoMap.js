// 카카오맵 SDK 로더.
// - 키는 .env의 VITE_KAKAO_MAP_KEY에서 읽는다.
// - 주소→좌표 변환(services.Geocoder)에 필요하므로 libraries=services를 반드시 포함한다.
// - autoload=false + kakao.maps.load() 콜백으로 "로드 완료 후 사용"을 보장한다.

const KAKAO_MAP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY

let sdkPromise = null

export function loadKakaoMapSdk() {
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      resolve(window.kakao)
      return
    }
    if (!KAKAO_MAP_KEY) {
      reject(new Error('VITE_KAKAO_MAP_KEY가 .env에 설정되지 않았습니다.'))
      return
    }
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&libraries=services&autoload=false`
    script.async = true
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao))
    script.onerror = () => reject(new Error('카카오맵 SDK 로드에 실패했습니다.'))
    document.head.appendChild(script)
  })

  return sdkPromise
}

export const hasKakaoKey = Boolean(KAKAO_MAP_KEY)
