// 지도 아래 카페 목록 카드 영역.
// 방문 여부 배지와 한줄 소감 자리를 잡아둔다.
export default function CafeList({ cafes }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-base font-semibold text-gray-900">
        카페 목록 <span className="text-gray-400">({cafes.length})</span>
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cafes.map((cafe) => (
          <article
            key={cafe.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900">{cafe.name}</h3>
              <span
                className={
                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ' +
                  (cafe.visited
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500')
                }
              >
                {cafe.visited ? '방문함' : '미방문'}
              </span>
            </div>

            <p className="mt-1 text-xs text-gray-400">{cafe.category}</p>
            <p className="mt-1 text-sm text-gray-600">{cafe.address}</p>

            <p className="mt-3 min-h-[1.25rem] text-sm text-gray-700">
              {cafe.memo
                ? `“${cafe.memo}”`
                : <span className="text-gray-300">아직 소감이 없어요</span>}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
