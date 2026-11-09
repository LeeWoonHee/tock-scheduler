# 구현 완료 기록

기획서의 1차 출시 기능을 빈 작업 폴더에 새로 구현했습니다. TanStack Start·React·Tailwind·Radix 기반 shadcn/ui 스타일·Motion·TanStack Query·Zustand·Neon·Drizzle·Better Auth 연결 코드로 구성했습니다. 기존 사용자 코드의 수정·삭제는 없습니다. 입력 기획서 DOCX도 변경하지 않았습니다.

## 변경 파일

아래는 이번 작업에서 생성한 소스·설정·테스트·마이그레이션 전체 목록입니다. node_modules, .output, .tanstack 등 재생성 가능한 의존성·빌드 산출물은 제외했습니다. 각 링크는 현재 파일의 코드 시작 줄을 가리킵니다.

| 파일 | 구분 | 추가한 코드와 역할 |
| --- | --- | --- |
| [.env.example](/Users/leewoonhee/Project/tts/ticktick-copy/.env.example:1) | 추가 | Neon·Better Auth·Google OAuth·로컬 저장 및 2차 알림 환경변수 예시 추가 |
| [.github/workflows/check.yml](/Users/leewoonhee/Project/tts/ticktick-copy/.github/workflows/check.yml:1) | 추가 | 타입·단위·통합·빌드 PR 검증 작업 추가 |
| [.gitignore](/Users/leewoonhee/Project/tts/ticktick-copy/.gitignore:1) | 추가 | 의존성·빌드 산출물·비밀·로컬 사용자 데이터 제외 규칙 추가 |
| [.prettierignore](/Users/leewoonhee/Project/tts/ticktick-copy/.prettierignore:1) | 추가 | 자동 생성 라우트와 빌드·마이그레이션 메타데이터 포맷 제외 |
| [.prettierrc.json](/Users/leewoonhee/Project/tts/ticktick-copy/.prettierrc.json:1) | 추가 | 세미콜론·따옴표·줄 길이 코드 포맷 규칙 추가 |
| [IMPLEMENTATION.md](/Users/leewoonhee/Project/tts/ticktick-copy/IMPLEMENTATION.md:1) | 추가 | 전체 생성 파일·코드 변경·검증 결과를 정리한 인수인계 기록 |
| [README.md](/Users/leewoonhee/Project/tts/ticktick-copy/README.md:1) | 추가 | 실행·환경변수·데이터 규칙·검증·배포 및 미검증 범위 안내 추가 |
| [drizzle/0000_handy_arclight.sql](/Users/leewoonhee/Project/tts/ticktick-copy/drizzle/0000_handy_arclight.sql:1) | 추가 | Drizzle Kit가 생성한 초기 13개 테이블·제약·인덱스 마이그레이션 |
| [drizzle/meta/0000_snapshot.json](/Users/leewoonhee/Project/tts/ticktick-copy/drizzle/meta/0000_snapshot.json:1) | 추가 | Drizzle 초기 스키마 스냅샷 자동 생성 |
| [drizzle/meta/_journal.json](/Users/leewoonhee/Project/tts/ticktick-copy/drizzle/meta/_journal.json:1) | 추가 | Drizzle 마이그레이션 순서 저널 자동 생성 |
| [drizzle.config.ts](/Users/leewoonhee/Project/tts/ticktick-copy/drizzle.config.ts:3) | 추가 | Neon 직접 연결 기반 마이그레이션 설정 추가 |
| [package.json](/Users/leewoonhee/Project/tts/ticktick-copy/package.json:1) | 추가 | 의존성 버전 고정, dev/build/start/typecheck/test/db 스크립트 추가 |
| [public/favicon.svg](/Users/leewoonhee/Project/tts/ticktick-copy/public/favicon.svg:1) | 추가 | Dayflow 체크 표시 아이콘 추가 |
| [scripts/check-production.mjs](/Users/leewoonhee/Project/tts/ticktick-copy/scripts/check-production.mjs:1) | 추가 | 운영 필수 환경변수·인증 패키지 확인, 로컬 설정으로 운영 시작 차단 |
| [scripts/integration.mjs](/Users/leewoonhee/Project/tts/ticktick-copy/scripts/integration.mjs:1) | 추가 | 포트를 열지 않는 실제 Start SSR·쿠키·CSRF·서버 함수 통합 검증 26개 추가 |
| [src/components/app-shell.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/components/app-shell.tsx:51) | 추가 | AppShell의 탐색·검색·필터·리스트·태그 생성·시간대·로그아웃·모바일 Sheet 추가 |
| [src/components/ui/button.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/components/ui/button.tsx:21) | 추가 | Button 및 cva 기반 variant·size 재사용 규칙 추가 |
| [src/components/ui/checkbox.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/components/ui/checkbox.tsx:4) | 추가 | Radix Checkbox 상태·키보드·완료 표시 추가 |
| [src/components/ui/dialog.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/components/ui/dialog.tsx:5) | 추가 | DialogContent의 모달·Sheet와 제목·설명·포커스 관리 추가 |
| [src/components/ui/dropdown-menu.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/components/ui/dropdown-menu.tsx:3) | 추가 | DropdownMenu 항목·구분선·포털 추가 |
| [src/components/ui/input.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/components/ui/input.tsx:3) | 추가 | Input·Textarea·Select의 공통 폼·포커스 스타일 추가 |
| [src/components/ui/popover.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/components/ui/popover.tsx:3) | 추가 | PopoverContent의 날짜·필터 패널 포털 추가 |
| [src/db/client.server.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/db/client.server.ts:7) | 추가 | withDatabase의 Neon WebSocket 연결·풀 제한·종료 처리 추가 |
| [src/db/schema/index.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/db/schema/index.ts:18) | 추가 | Better Auth 4개와 도메인 9개 테이블, 고유성·복합 외래 키·일정 제약·인덱스 추가 |
| [src/features/calendar/calendar-screen.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/calendar/calendar-screen.tsx:24) | 추가 | CalendarScreen의 월간 42칸 flex 달력·날짜 선택·일정 이동·미정 작업 추가 |
| [src/features/tasks/draft.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/tasks/draft.ts:4) | 추가 | draftPatch로 실제 변경된 필드만 추출해 동시 편집 데이터 보존 |
| [src/features/tasks/queries.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/tasks/queries.ts:5) | 추가 | workspaceOptions 공통 쿼리 키와 unwrap·ApiError 추가 |
| [src/features/tasks/schedule-picker.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/tasks/schedule-picker.tsx:9) | 추가 | SchedulePicker의 오늘·내일·직접 날짜·일정 제거 메뉴 추가 |
| [src/features/tasks/schemas.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/tasks/schemas.ts:4) | 추가 | Zod의 허용 필드·일정 조합·버전·요청 ID·캘린더 62일 범위 검증 추가 |
| [src/features/tasks/selectors.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/tasks/selectors.ts:4) | 추가 | selectTasks의 Inbox·오늘·다가오는 일정·휴지통 공통 필터 추가 |
| [src/features/tasks/task-composer.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/tasks/task-composer.tsx:11) | 추가 | TaskComposer의 한글 조합 Enter 보호·날짜·재시도 requestId 유지 추가 |
| [src/features/tasks/task-detail.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/tasks/task-detail.tsx:20) | 추가 | TaskDetailSlot·TaskDetail의 URL 선택·서버 권한 조회·초안·버전 충돌·기간·태그 편집 추가 |
| [src/features/tasks/task-row.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/tasks/task-row.tsx:20) | 추가 | TaskRow의 완료·일정·리스트 이동·삭제·복원·드래그 및 접근성 라벨 추가 |
| [src/features/tasks/task-screen.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/tasks/task-screen.tsx:38) | 추가 | TaskScreen의 기한 초과·날짜·섹션·완료 그룹, 빈 상태와 수동 이동 추가 |
| [src/features/tasks/types.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/tasks/types.ts:1) | 추가 | Task·Schedule·WorkspaceDTO·SessionDTO·Result·TaskPatch 계약 추가 |
| [src/features/tasks/use-task-actions.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/tasks/use-task-actions.ts:21) | 추가 | useTaskActions의 항목별 직렬화·낙관적 완료/삭제·부분 롤백·캐시 무효화·되돌리기 추가 |
| [src/hooks/use-current-time.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/hooks/use-current-time.ts:3) | 추가 | useCurrentTime으로 자정·창 재활성화 후 오늘 기준 갱신 |
| [src/hooks/use-ui-store.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/hooks/use-ui-store.ts:4) | 추가 | Zustand useUIStore에 공유 탐색 열림 상태만 저장 |
| [src/lib/dates.test.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/lib/dates.test.ts:1) | 추가 | 날짜·윤일·DST·기간 겹침·캘린더 이동 단위 테스트 10개 추가 |
| [src/lib/dates.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/lib/dates.ts:20) | 추가 | 종일 종료 미포함·현지 자정·DST·날짜 정렬·달력 이동, 범위 제한 캐시 추가 |
| [src/lib/utils.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/lib/utils.ts:4) | 추가 | cn으로 Tailwind 클래스 조합과 충돌 병합 |
| [src/routeTree.gen.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/routeTree.gen.ts:85) | 추가 | TanStack Router가 자동 생성한 타입 안전 라우트 트리 |
| [src/router.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/router.tsx:6) | 추가 | getRouter의 요청별 QueryClient와 SSR Query 통합 추가 |
| [src/routes/__root.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/__root.tsx:13) | 추가 | RootDocument·MotionConfig·Toaster, 공통 메타·404·오류 화면 추가 |
| [src/routes/_app.app.calendar.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/_app.app.calendar.tsx:3) | 추가 | createFileRoute 기반 calendar 화면 연결 또는 기본 경로 리다이렉트 추가 |
| [src/routes/_app.app.inbox.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/_app.app.inbox.tsx:3) | 추가 | createFileRoute 기반 inbox 화면 연결 또는 기본 경로 리다이렉트 추가 |
| [src/routes/_app.app.index.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/_app.app.index.tsx:2) | 추가 | createFileRoute 기반 index 화면 연결 또는 기본 경로 리다이렉트 추가 |
| [src/routes/_app.app.lists.$listId.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/_app.app.lists.$listId.tsx:3) | 추가 | createFileRoute 기반 lists.$listId 화면 연결 또는 기본 경로 리다이렉트 추가 |
| [src/routes/_app.app.today.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/_app.app.today.tsx:3) | 추가 | createFileRoute 기반 today 화면 연결 또는 기본 경로 리다이렉트 추가 |
| [src/routes/_app.app.trash.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/_app.app.trash.tsx:3) | 추가 | createFileRoute 기반 trash 화면 연결 또는 기본 경로 리다이렉트 추가 |
| [src/routes/_app.app.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/_app.app.tsx:4) | 추가 | workspaceOptions loader와 task/month/q/tag/priority/sort 검색 상태 검증 추가 |
| [src/routes/_app.app.upcoming.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/_app.app.upcoming.tsx:3) | 추가 | createFileRoute 기반 upcoming 화면 연결 또는 기본 경로 리다이렉트 추가 |
| [src/routes/_app.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/_app.tsx:3) | 추가 | 보호 beforeLoad에서 세션 검사 후 비로그인 사용자를 /login으로 이동 |
| [src/routes/api.auth.$.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/api.auth.$.ts:21) | 추가 | 프로젝트 설정 또는 생성 파일 추가 |
| [src/routes/index.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/index.tsx:2) | 추가 | createFileRoute 기반 index 화면 연결 또는 기본 경로 리다이렉트 추가 |
| [src/routes/login.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/login.tsx:8) | 추가 | Login의 Google OAuth·로컬 로그인, 안전한 내부 복귀 경로와 오류 안내 추가 |
| [src/server/auth/auth.server.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/auth/auth.server.ts:15) | 추가 | getSession·requireActor·withAuth·로컬 HMAC 쿠키, HTTP 인증 쿠키 전달 및 운영 모드 차단 추가 |
| [src/server/functions/auth.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/functions/auth.ts:10) | 추가 | getSessionFn·getAuthMode·localLogin·localLogout 서버 함수 추가 |
| [src/server/functions/tasks.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/functions/tasks.ts:38) | 추가 | GET 조회·POST 변경 서버 함수와 INVALID_INPUT/VERSION_CONFLICT 등 Result 오류 계약 추가 |
| [src/server/repositories/local.server.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/repositories/local.server.ts:7) | 추가 | LocalRepository의 파일 잠금·원자적 교체·사용자별 개발 저장 추가 |
| [src/server/repositories/postgres.server.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/repositories/postgres.server.ts:10) | 추가 | PostgresRepository의 워크스페이스 행 잠금·멤버십·Drizzle 트랜잭션·관계 저장 추가 |
| [src/server/repositories/types.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/repositories/types.ts:3) | 추가 | WorkspaceRepository·Actor 계약 및 emptyWorkspace 초기화 추가 |
| [src/server/services/errors.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/services/errors.ts:3) | 추가 | DomainError와 권한 없는 ID를 숨기는 notFound 추가 |
| [src/server/services/index.server.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/services/index.server.ts:6) | 추가 | taskService에서 개발/Neon 저장소 선택 |
| [src/server/services/task.service.test.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/services/task.service.test.ts:1) | 추가 | 권한·동시 요청·충돌·저장·조회 동일성·초안 보존 단위 테스트 16개 추가 |
| [src/server/services/task.service.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/services/task.service.ts:28) | 추가 | TaskService의 워크스페이스 검증·멱등 요청·버전·수동 정렬·완료·삭제·복원 비즈니스 로직 추가 |
| [src/start.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/start.ts:10) | 추가 | privatePages 보안·캐시 헤더와 명시적인 createCsrfMiddleware 추가 |
| [src/styles.css](/Users/leewoonhee/Project/tts/ticktick-copy/src/styles.css:1) | 추가 | Swiss 흰색·중성 회색·파랑 토큰, 폰트·포커스·기본 스타일 추가 |
| [tsconfig.json](/Users/leewoonhee/Project/tts/ticktick-copy/tsconfig.json:1) | 추가 | strict TypeScript·React JSX·@ 경로 별칭 추가 |
| [vercel.json](/Users/leewoonhee/Project/tts/ticktick-copy/vercel.json:1) | 추가 | Vercel용 Nitro 빌드 명령 추가 |
| [vite.config.ts](/Users/leewoonhee/Project/tts/ticktick-copy/vite.config.ts:8) | 추가 | TanStack Start·Tailwind·React·Nitro, 환경변수 로드와 Better Auth 의존성 추적 추가 |

## 핵심 코드 변경

`TaskService.task`는 워크스페이스를 확인한 뒤 버전이 다른 변경을 거절합니다. 요청 영수증과 실제 변경은 같은 저장소 트랜잭션에서 처리합니다.

```ts
if (task.version !== input.expectedVersion)
  throw new DomainError(
    'VERSION_CONFLICT',
    '다른 창에서 수정되었습니다. 최신 내용을 확인하고 다시 저장해 주세요.',
    task.version,
  )
```

`TaskComposer`는 동일한 초안의 재시도에서 `requestId`를 유지합니다. 한글 조합 중 Enter는 저장을 발생시키지 않습니다.

```ts
if (attempt.current?.fingerprint !== fingerprint)
  attempt.current = { fingerprint, requestId: crypto.randomUUID() }
```

`draftPatch`는 사용자가 바꾼 필드만 서버에 전달합니다. 날짜 변경과 제목 변경이 다른 창에서 겹쳤을 때, 수정하지 않은 필드를 덮어쓰지 않도록 했습니다.

```ts
if (draft.title !== baseline.title) patch.title = draft.title
if (draft.body !== baseline.body) patch.body = draft.body
```

`src/start.ts`에는 사용자 데이터의 공유 캐시를 막는 헤더와 서버 함수의 명시적인 CSRF 보호를 추가했습니다. `getRouter`의 QueryClient는 요청마다 생성합니다. 날짜와 목록 규칙은 공통 함수로 분리했고, 저장소 인터페이스로 개발 파일 저장과 Neon 트랜잭션을 분리했습니다.

## 영향

- 기존 앱·API와의 호환성 파괴 없음: 최초 구현입니다.
- 인증 4개·업무 도메인 9개, 총 13개 PostgreSQL 테이블의 마이그레이션을 생성했습니다. 실제 DB에는 적용하지 않았습니다.
- 새 서버 함수의 읽기는 GET, 변경은 POST입니다. 인증 외부 경로는 `/api/auth/$`입니다.
- 운영에는 DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET이 필요합니다. 마이그레이션은 DATABASE_URL_DIRECT를 사용합니다.
- 개발 로컬 모드는 서버의 파일 저장이며 클라우드 동기화가 아닙니다. 운영 빌드에서는 사용할 수 없습니다.

## 검증

- TypeScript 타입 검사 통과.
- 단위 테스트 26개, 74개 assertion 통과.
- 실제 Start SSR·서버 함수 통합 검증 26개 assertion 통과.
- Vite/Nitro 클라이언트·서버 빌드 통과. Better Auth 미설치 경고는 별도로 남겼습니다.
- Drizzle 초기 마이그레이션 생성 성공.
- 운영 빌드의 로컬 로그인 차단과 클라이언트 번들의 서버 환경변수·파일 시스템 코드 제외 확인.
- 운영 사전 점검은 필요한 자격증명과 Better Auth 패키지가 없어 예상대로 실행을 차단했습니다.

## 남은 작업과 한계

1. 네트워크가 허용된 환경에서 npm install을 완료하고 lockfile을 생성·검토해야 합니다. 이 환경은 기존 로컬 의존성으로 검증했으며 Better Auth는 설치하지 못했습니다.
2. Neon 개발 DB 마이그레이션, Google OAuth 실제 왕복, Vercel 프리뷰와 DB 트랜잭션 검증은 자격증명이 필요합니다. 배포하지 않았습니다.
3. 로컬 포트 바인딩이 거절되어 실제 브라우저의 시각·클릭·드래그·IME 검증은 수행하지 못했습니다. 서버 흐름은 포트 없는 실제 SSR Request 검증으로 확인했습니다.
4. 개인용 초기 저장소는 워크스페이스를 읽어 필터링하고 변경을 저장합니다. 데이터가 커지기 전 DB 조회·부분 저장 최적화가 필요합니다.
5. 반복·회차 예외·서버리스 알림·주간·칸반 및 나머지 후속 기능은 기획서의 2차 이후 범위로 남겼습니다.

## 실행

```bash
npm install
cp .env.example .env
npm run dev
```

브라우저에서 http://localhost:3100 을 열고 로컬에서 시작을 선택합니다. 전체 환경 설정과 수동 검증 절차는 README.md에 있습니다.


## 라이트 및 다크 모드 설정 추가

설정의 화면 모드에서 라이트·다크·시스템을 선택할 수 있습니다. 기본값은 시스템입니다. 선택은 dayflow.theme 키로 브라우저에 자동 저장하며 로그인 화면에도 적용됩니다. 계정 간 서버 동기화는 하지 않습니다. 첫 화면이 잘못된 색으로 보이지 않도록 head 스크립트가 React 초기화 전에 적용합니다.

기존 하드코딩된 흰색·고정 파란 글자·회색·오류색을 공통 토큰으로 교체해 입력·체크박스·모달·팝오버·메뉴·상세·달력·알림 전체가 함께 바뀌도록 했습니다. 삭제한 파일·함수는 없으며, 고정 색상 클래스만 의미별 토큰으로 대체했습니다.

### 이번 작업의 변경 파일

| 파일 | 구분 | 실제 추가·수정 코드 |
| --- | --- | --- |
| [src/lib/theme.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/lib/theme.ts:1) | 추가 | ThemePreference·ThemeMode·resolveTheme·readThemePreference·초기 THEME_BOOTSTRAP_SCRIPT로 테마 판정과 저장 값 검증 |
| [src/lib/theme.test.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/lib/theme.test.ts:1) | 추가 | 첫 렌더 복원·시스템 우선순위·잘못된 값·저장소 차단에 대한 테스트 5개 |
| [src/hooks/use-theme-store.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/hooks/use-theme-store.ts:17) | 추가 | Zustand useThemeStore의 theme·resolvedTheme·setTheme·syncTheme와 브라우저 저장 |
| [src/components/theme-provider.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/components/theme-provider.tsx:5) | 추가 | ThemeProvider에서 초기 복원, 시스템 변경·다른 탭 storage 이벤트 구독과 정리 |
| [src/components/theme-selector.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/components/theme-selector.tsx:12) | 추가 | ThemeSelector의 키보드 접근 가능한 라이트·다크·시스템 라디오 선택 |
| [src/styles.css](/Users/leewoonhee/Project/tts/ticktick-copy/src/styles.css:1) | 수정 | dark 변형과 라이트·다크 배경·글자·테두리·컨트롤·오류·경고 공통 토큰 |
| [src/routes/__root.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/__root.tsx:28) | 수정 | RootContent에 ThemeProvider·테마별 Toaster, head의 첫 화면 테마 스크립트 |
| [src/components/app-shell.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/components/app-shell.tsx:52) | 수정 | 설정 Dialog에 ThemeSelector 연결, 탐색·아바타·기본 리스트 색상 토큰화 |
| [src/components/ui/button.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/components/ui/button.tsx:21) | 수정 | Button 배경·주 강조색 위 글자·오류색·포커스 간격 토큰화 |
| [src/components/ui/checkbox.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/components/ui/checkbox.tsx:4) | 수정 | Checkbox 바탕·테두리·체크 글자 색상 토큰화 |
| [src/components/ui/dialog.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/components/ui/dialog.tsx:5) | 수정 | DialogContent·Sheet 표면과 다크 오버레이 조정 |
| [src/components/ui/dropdown-menu.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/components/ui/dropdown-menu.tsx:3) | 수정 | DropdownMenuContent 표면 토큰화 |
| [src/components/ui/input.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/components/ui/input.tsx:3) | 수정 | Input·Textarea·Select 표면 토큰화, color-scheme으로 네이티브 날짜 입력 일치 |
| [src/components/ui/popover.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/components/ui/popover.tsx:3) | 수정 | PopoverContent 표면 토큰화 |
| [src/routes/login.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/login.tsx:8) | 수정 | 로그인 배경·로고·오류 안내를 현재 테마에 맞게 표시 |
| [src/features/tasks/task-composer.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/tasks/task-composer.tsx:11) | 수정 | TaskComposer 입력 바탕·포커스 링·테두리의 고정 색상 제거 |
| [src/features/tasks/task-row.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/tasks/task-row.tsx:20) | 수정 | TaskRow의 우선순위·삭제·기한 초과·체크 상태의 다크 대비 보완 |
| [src/features/tasks/task-screen.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/tasks/task-screen.tsx:38) | 수정 | TaskScreen 진행률 SVG와 기한 초과·그룹 표시 색상 토큰화 |
| [src/features/tasks/task-detail.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/tasks/task-detail.tsx:20) | 수정 | TaskDetail 충돌 안내의 경고 배경·테두리·글자 토큰화 |
| [src/features/calendar/calendar-screen.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/calendar/calendar-screen.tsx:24) | 수정 | CalendarScreen 오늘·주말·완료 항목 색상 토큰화 |
| [IMPLEMENTATION.md](/Users/leewoonhee/Project/tts/ticktick-copy/IMPLEMENTATION.md:1) | 수정 | 이번 테마 작업의 추가·수정·삭제 구분, 파일별 코드와 검증 결과 기록 |

### 핵심 코드

설정 화면에 공통 선택 컴포넌트를 연결했습니다.

```tsx
<ThemeSelector />
```

최상위 문서의 dark 클래스와 브라우저 네이티브 컨트롤의 색상 모드를 함께 갱신합니다.

```ts
document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
document.documentElement.style.colorScheme = resolvedTheme
```

`setTheme`는 `window.localStorage.setItem(THEME_STORAGE_KEY, theme)`로 저장하고, `ThemeProvider`는 OS 설정과 다른 탭의 변경을 반영합니다. 저장소를 사용할 수 없어도 현재 탭의 전환은 동작하도록 처리했습니다.

### 영향과 검증

- 호환성 파괴, DB·스키마·API·환경변수 변경 없음. 신규 의존성 없음.
- 신규 테마 테스트 5개를 포함해 전체 단위 테스트 31개 통과.
- 타입 검사, 실제 SSR·서버 함수 통합 검증 26개, 클라이언트·서버 빌드 통과.
- 기존 Better Auth 미설치 빌드 경고는 이번 변경과 무관하며 그대로 남아 있습니다.
- 구현 TODO 없음. 실제 브라우저의 시각·클릭 검증은 기존 실행 환경의 포트 제한으로 수행하지 못했습니다.
- 수동 확인: 좌측 아래 계정 메뉴 → 설정 → 화면 모드 선택 → 목록·달력·날짜 팝오버·상세·알림 확인 → 새로고침 → 다른 탭·시스템 모드 변경 확인.
