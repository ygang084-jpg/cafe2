import { useEffect, useState } from 'react'

// 오프라인 안내 오버레이.
// 지도(카카오맵)·로그인·소감 저장은 모두 인터넷 연결이 있어야 동작하므로,
// 연결이 끊기면 캐시된 화면을 그대로 두는 대신 "인터넷 연결이 필요합니다" 안내를 덮어 보여준다.
export default function OfflineNotice() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOffline(false)
    const goOffline = () => setOffline(true)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 px-6 text-center backdrop-blur-sm">
      <div className="max-w-sm">
        <div className="mb-4 text-5xl">📡</div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">인터넷 연결이 필요합니다</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          지도 표시, 로그인, 소감 저장은 인터넷 연결이 있어야 동작해요.
          <br />
          연결 상태를 확인한 뒤 다시 시도해 주세요.
        </p>
      </div>
    </div>
  )
}
