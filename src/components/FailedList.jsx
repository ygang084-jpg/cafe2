// 주소를 좌표로 못 찾은 카페 안내 목록.
// (사라지게 두지 않고, 어떤 카페를 못 찾았는지 화면에 보여준다.)
export default function FailedList({ failedCafes }) {
  if (!failedCafes || failedCafes.length === 0) return null

  return (
    <section className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <h2 className="text-sm font-semibold text-amber-800">
        ⚠️ 주소를 찾지 못한 카페 ({failedCafes.length})
      </h2>
      <p className="mt-1 text-xs text-amber-700">
        아래 카페는 주소를 좌표로 변환하지 못해 지도에 표시되지 않았어요. 주소를 확인해 주세요.
      </p>
      <ul className="mt-2 space-y-1">
        {failedCafes.map((cafe) => (
          <li key={cafe.id} className="text-sm text-amber-900">
            <span className="font-medium">{cafe.name}</span>
            <span className="text-amber-700"> — {cafe.address}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
