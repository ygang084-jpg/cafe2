# 우리 동네 카페 지도 서비스 (cafe-map)

엑셀 카페 목록(이름·주소·카테고리)을 업로드하면 주소를 좌표로 변환해 카카오맵에 마커로 표시하고,
로그인한 사용자가 카페별 **방문 여부**와 **한줄 소감**을 기록·조회하는 반응형 웹 서비스.

> 상세 사양은 [`PRD.md`](./PRD.md), 아키텍처 규칙은 [`CLAUDE.md`](./CLAUDE.md) 참조.

---

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| 프론트엔드 | React 19 + Vite 8 |
| 스타일 | Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui, lucide-react |
| 지도 | 카카오맵 JS SDK (`libraries=services` 지오코딩 포함) |
| 엑셀 파싱 | `xlsx` |
| 인증·DB | Supabase (Auth + Postgres, RLS) |
| PWA | `vite-plugin-pwa` (Workbox 기반 서비스워커 + 웹 매니페스트) |

---

## 아키텍처 한눈에 보기

두 개의 독립된 경로로 나뉜다. **백엔드 서버는 없다.**

```
                    ┌─────────────────────────────────────────┐
   엑셀 업로드  ───▶ │  지도 경로 (프론트엔드 전용)              │
                    │  excel.js → geocode.js → CafeMap(마커)   │
                    └─────────────────────────────────────────┘
                    ┌─────────────────────────────────────────┐
   로그인/소감  ───▶ │  데이터 경로 (Supabase 전용)             │
                    │  AuthProvider · cafeNotes.js → Postgres  │
                    │  격리는 애플리케이션 코드가 아닌 RLS로 강제 │
                    └─────────────────────────────────────────┘
```

- **지도 = 프론트엔드 직접 호출**: 카카오맵 SDK와 지오코딩(주소→좌표)을 프론트에서 바로 호출한다.
  백엔드 프록시 없음. 지오코딩 실패 주소는 지도에 찍지 않고 "표시 실패 목록"으로 안내한다.
- **데이터 = Supabase 직접 호출**: 인증과 소감 저장을 Supabase로 처리한다. 별도 서버가 없으므로
  **데이터 격리는 RLS(행 수준 보안)로 DB에서 강제**한다. 클라이언트에는 `anon` 키만 둔다.
- **엑셀은 표시용, DB는 기록용**: 엑셀은 지도에 뿌릴 임시 목록을 만드는 용도이고,
  "방문한 카페 모아보기"는 엑셀 없이 저장된 본인 기록만으로 동작한다.

---

## 디렉터리 구조

```
src/
├─ App.jsx                  # 전역 상태 오케스트레이션 (엑셀→지오코딩→마커, 소감 오버레이)
├─ main.jsx                 # 엔트리 (AuthProvider로 앱 감쌈)
├─ context/
│  └─ AuthProvider.jsx      # Supabase 이메일/비번 인증 상태 공급 (useAuth)
├─ lib/
│  ├─ supabase.js           # Supabase 클라이언트 (env 없으면 null → 앱은 계속 동작)
│  ├─ excel.js              # 엑셀 → 카페 배열 파싱
│  ├─ kakaoMap.js           # 카카오맵 SDK 로더 (한 번만 로드, Promise 캐시)
│  ├─ geocode.js            # 주소→좌표 순차 변환 + 주소 캐시
│  ├─ cafeNotes.js          # 소감 데이터 접근 계층 (upsert / 조회, visit_notes)
│  └─ visitSummary.js       # 방문 현황 파생 계산 (F6)
├─ components/
│  ├─ CafeMap.jsx           # 카카오맵 마커 렌더 (방문/미방문 색 구분, 재그리기)
│  ├─ CafeList.jsx          # 카페 목록
│  ├─ FailedList.jsx        # 지오코딩 실패 목록 안내
│  ├─ VisitDialog.jsx       # 마커 클릭 팝업 (방문 체크 + 소감 입력/저장)
│  ├─ VisitedCafes.jsx      # 방문한 카페 모아보기 (F5)
│  ├─ VisitSummary.jsx      # "총 ○곳 중 ○곳 방문" 요약 (F6)
│  ├─ AuthDialog.jsx        # 로그인/회원가입 팝업
│  ├─ Header.jsx            # 상단 바 (엑셀 업로드, 로그인/로그아웃)
│  ├─ OfflineNotice.jsx     # 오프라인 시 "인터넷 연결이 필요합니다" 오버레이 (PWA)
│  └─ ui/                   # shadcn/ui 기본 컴포넌트
└─ data/                    # 목업 데이터 · 샘플 엑셀
public/
├─ pwa-192x192.png          # PWA 아이콘 (플레이스홀더 — 실제 이미지로 교체)
├─ pwa-512x512.png          # PWA 아이콘 (일반 + maskable 겸용)
└─ apple-touch-icon.png     # iOS 홈 화면 아이콘
vite.config.js              # Vite + VitePWA 플러그인 설정 (매니페스트/서비스워커)
supabase/
└─ migrations/0001_visit_notes.sql   # 테이블 + RLS 정책
```

---

## 구현한 기능 (F1~F7)

### F1. 엑셀 업로드 및 목록 읽기 — `lib/excel.js`
- `xlsx`로 첫 시트를 읽어 `이름/주소/카테고리` 컬럼을 매핑한다.
- 이름·주소가 비어 있는 행은 건너뛴다. 같은 파일을 다시 선택할 수 있도록 input 값을 초기화한다.

### F2. 지오코딩 및 마커 표시 — `lib/geocode.js`, `lib/kakaoMap.js`, `components/CafeMap.jsx`
- **SDK 로더**: `autoload=false` + `kakao.maps.load()` 콜백으로 로드 완료를 보장하고,
  Promise를 모듈에 캐시해 SDK를 한 번만 로드한다. 지오코딩을 위해 `libraries=services`를 포함한다.
- **순차 변환**: 주소를 `await`로 **한 번에 하나씩** 변환한다. 동일 주소는 `Map` 캐시로 재변환을 막는다.
- **실패 처리**: 좌표를 못 찾은 카페는 마커를 찍지 않고 `{ located, failed }`로 분리해
  `FailedList`에 안내한다 (핵심 요구사항).
- **마커 재그리기**: 목록이 바뀌면 이전 마커를 전부 `setMap(null)`로 지운 뒤 새로 그린다(겹침 방지).
  방문/미방문 `MarkerImage`는 2개만 만들어 재사용하고, 핀은 외부 CDN 없이 SVG data URI로 인라인한다.

### F3·F4. 방문 체크 + 한줄 소감 저장/영속화 — `lib/cafeNotes.js`, `components/VisitDialog.jsx`
- 마커 클릭 → 팝업에서 방문 여부와 소감을 입력한다. (조회는 비로그인도 가능, 저장은 로그인 필요)
- **핵심 불변식 — 1인 1장소 1기록**: 저장은 insert가 아니라 **upsert**
  (`onConflict: 'user_id,place_name,address'`)로 처리해, 같은 사람의 같은 장소(이름+주소) 기록을 항상 1개만 유지한다.
- 재방문 시 이전 소감이 그대로 다시 보인다(F4). 로그인이 필요한 상황은 `AuthRequiredError`로
  구분해, 에러 화면 대신 로그인 안내를 띄운다.
- DB 컬럼 매핑: `name → place_name`, `memo → impression`.

### F5. 방문한 카페 모아보기 — `components/VisitedCafes.jsx`, `fetchVisitedCafes()`
- **엑셀 없이** 로그인만 되면 `visited = true`인 본인 기록만 최신순으로 조회한다.
- 항목 클릭 시 지도 중심을 해당 카페로 이동(`panTo`)한다. 같은 항목을 다시 눌러도 반응하도록
  App이 매번 새 객체를 넘겨 지도 effect가 재실행되게 한다.

### F6. 방문 현황 요약 — `lib/visitSummary.js`, `components/VisitSummary.jsx`
- 새 API/DB 쿼리 없이 화면에 이미 든 카페 목록만으로 "총 ○곳 중 ○곳 방문"을 **파생 계산**한다.
- 분모 = 지도에 표시 중인 카페(지오코딩 성공분), 분자 = 그중 `visited === true`.
- 소감 저장 시 오버레이 상태를 즉시 갱신해 **팝업을 다시 열지 않아도** 수치가 반영된다.

### F7. 방문 여부에 따른 마커 색 구분 — `components/CafeMap.jsx`
- 방문 완료: 짙은 에메랄드(`#059669`) + 흰색 체크, 미방문: 앰버(`#f59e0b`) + 흰색 점.
- 색뿐 아니라 **형태(체크/점)로도 구분**해 색약 접근성을 확보한다. 저장 즉시 색이 갱신된다.

---

## PWA (설치형 웹앱) — `vite.config.js`, `components/OfflineNotice.jsx`

홈 화면에 설치할 수 있는 PWA로 구성했다. 카카오맵·Supabase는 인터넷 연결이 있어야 동작하므로,
**전 기능 오프라인화는 목표가 아니다.** 앱 셸만 캐시해 설치·초기 로딩을 빠르게 하고,
오프라인 상태에서는 안내 문구를 보여준다.

### 웹 매니페스트
- 이름 `우리 동네 카페 지도`, 짧은 이름 `카페지도`, `display: standalone`, `lang: ko`.
- **테마/배경색은 현재 헤더에 맞춤**: `theme_color`는 헤더 브랜드 강조색 **emerald-600(`#059669`)**,
  `background_color`는 흰 헤더 바 **`#ffffff`**. `index.html`에도 `theme-color` 메타 태그를 둔다.
- 아이콘: `192x192`, `512x512`(일반 + `maskable`) — `public/`의 **플레이스홀더**이며 실제 이미지로 교체하면 된다.

### 서비스워커 (Workbox `generateSW`)
- `registerType: 'autoUpdate'` — 새 빌드가 배포되면 서비스워커를 자동 갱신한다.
- `injectRegister: 'auto'` — SW 등록 코드를 `index.html`에 자동 주입한다(수동 등록 코드 없음).
- 프리캐시 대상은 **앱 셸(HTML/JS/CSS/아이콘)뿐**이다(`globPatterns`). 카카오맵·Supabase 등
  외부 런타임 요청은 캐시하지 않아 온라인에서만 동작한다.

### 오프라인 안내 — `OfflineNotice.jsx`
- `navigator.onLine`과 `online`/`offline` 이벤트를 구독해 연결이 끊기면
  **"인터넷 연결이 필요합니다"** 전체 화면 오버레이를 덮어 보여준다(캐시된 화면을 그대로 두지 않음).
- 지도·로그인·소감 저장이 모두 네트워크 의존이라, 오프라인에서의 혼란을 이 안내로 대신한다.

### 빌드 산출물 & 검증
- `npm run build` 시 `dist/`에 `manifest.webmanifest`, `sw.js`, `registerSW.js`가 생성된다.
- `npm run preview`로 띄운 뒤 크롬 주소창 오른쪽 **설치 아이콘(⊕)** 으로 설치할 수 있다.
  (`localhost`는 보안 컨텍스트로 인정되어 서비스워커가 동작한다.)

---

## 상태 흐름 (App.jsx)

- 엑셀 카페 목록(`cafes`)에 로그인 사용자의 저장 기록(`notes`)을 **덧입혀**(`displayedCafes`)
  지도·목록·요약·마커 색에 일관되게 사용한다. 매칭 키는 `이름 + 주소`(`noteKey`).
- 로그인하면 `fetchMyNotes()`로 내 소감을 불러와 오버레이하고, 로그아웃하면 오버레이를 비운다.
- 저장 성공 시 오버레이를 즉시 갱신하고, "방문한 카페" 목록은 `visitedVersion` 버전을 올려 새로고침한다.

---

## 데이터 모델 & 보안 (`supabase/migrations/0001_visit_notes.sql`)

`public.visit_notes` 테이블:

| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `user_id` | uuid | `auth.users(id)` 참조, `on delete cascade` |
| `place_name` | text | 카페 이름 |
| `address` | text | 주소 |
| `lat` / `lng` | double precision | 좌표 |
| `visited` | boolean | 기본 false |
| `impression` | text | 한줄 소감 |
| `updated_at` | timestamptz | |

- **UNIQUE(`user_id`, `place_name`, `address`)** — 1인 1장소 1기록 제약 (upsert의 충돌 기준).
- **RLS 활성화 + 본인 행만** select / insert / update 정책 (`auth.uid() = user_id`).
  update는 `USING`·`WITH CHECK`를 모두 걸어 수정 후에도 본인 소유를 유지한다.

---

## 환경변수 & 실행

`.env`를 만든다 (`.env.example` 참고, `.gitignore`에 포함되어 커밋되지 않음):

```bash
VITE_KAKAO_MAP_KEY=       # 카카오맵 JS 키 (콘솔에서 허용 도메인 화이트리스트로 보호)
VITE_SUPABASE_URL=        # Supabase 프로젝트 URL
VITE_SUPABASE_ANON_KEY=   # Supabase anon 키 (service_role 키는 절대 클라이언트에 두지 않음)
```

> Supabase 환경변수가 없으면 클라이언트를 `null`로 두어 앱이 죽지 않고 지도 조회는 계속 동작한다.
> 카카오 키가 없으면 지도 영역에 설정 안내를 표시한다.

```bash
npm install
npm run dev       # 개발 서버
npm run build     # 프로덕션 빌드 (dist/)
npm run preview   # 빌드 결과 미리보기
```

배포는 Vercel 환경변수로 위 값을 주입한다.
