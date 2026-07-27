// 헤더: 제목 + 엑셀 업로드 버튼 + (로그인 상태에 따라) 로그인 버튼 또는 이메일+로그아웃.

export default function Header({ user, onExcelUpload, onLogin, onLogout }) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">☕ 우리 동네 카페 지도</h1>

        <div className="flex items-center gap-2">
          {/* 엑셀 업로드 (F1) */}
          <label className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            엑셀 업로드
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onExcelUpload}
            />
          </label>

          {/* 로그인 상태에 따라 다르게 표시 (F4) */}
          {user ? (
            <>
              <span className="max-w-[180px] truncate text-sm text-gray-600" title={user.email}>
                {user.email}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                로그아웃
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
