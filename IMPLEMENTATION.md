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

## Vercel E403: TanStack Start 보안 의존성 수정

기존 `@tanstack/react-start@1.168.51`의 서버 코어 `1.169.33`은 [공식 보안 권고 GHSA-qx66-fv34-fjm8](https://github.com/TanStack/router/security/advisories/GHSA-qx66-fv34-fjm8)의 CVE-2026-102989 영향 버전이므로 Vercel에서 설치가 차단되었습니다. 프레임워크를 공식 수정 버전으로 올리고, 같은 릴리스의 React Router를 사용하도록 맞췄습니다.

### 이번 작업의 변경 파일과 코드

| 파일 | 구분 | 추가·수정·삭제한 내용 |
| --- | --- | --- |
| [package.json](/Users/leewoonhee/Project/tts/ticktick-copy/package.json:26) | 수정·추가 | `dependencies`의 `@tanstack/react-router`를 `1.170.34 → 1.170.41`, `@tanstack/react-start`를 `1.168.51 → 1.168.60`으로 수정. `overrides["@tanstack/start-server-core"] = "1.169.39"`를 추가해 중첩 의존성에도 수정 버전 적용 |
| [README.md](/Users/leewoonhee/Project/tts/ticktick-copy/README.md:99) | 수정 | Vercel E403 원인, 보안 권고, 재설치·설치 트리 확인·검증·lockfile 커밋·재배포 절차 추가 |
| [IMPLEMENTATION.md](/Users/leewoonhee/Project/tts/ticktick-copy/IMPLEMENTATION.md:207) | 수정 | 이번 보안 수정의 코드 변경·영향·검증 한계·남은 작업 기록 |

핵심 변경:

```diff
-    "@tanstack/react-router": "1.170.34",
+    "@tanstack/react-router": "1.170.41",
-    "@tanstack/react-start": "1.168.51",
+    "@tanstack/react-start": "1.168.60",
+  "overrides": {
+    "@tanstack/start-server-core": "1.169.39"
+  },
```

신규·삭제 파일과 리팩터링은 없습니다. 이전 작업에서 구현한 앱 코드와 UI는 이번 변경에 포함하지 않습니다.

### 영향

- DB·스키마·API·환경변수 변경 없음. 의도적인 호환성 파괴 없음.
- 설치되는 TanStack Start·Router 및 관련 하위 패키지는 변경됩니다. 업데이트 후 타입 검사와 SSR·빌드 재검증이 필요합니다.
- 취약 버전 배포를 허용하는 환경변수는 추가하지 않았습니다. 기존 Vercel의 `npm install` 및 Nitro 빌드 설정을 유지합니다.

### 검증과 남은 작업

- `package.json` JSON 파싱, 수정 버전 3개, Vercel 설치·빌드 명령, 보안 차단 우회 미사용을 Node assert로 확인했습니다.
- `npm run typecheck` 통과. `npm test` 단위 테스트 31개, assertion 93개 통과. 이는 **기존 설치본을 사용한 검증**입니다.
- `npm install --package-lock-only --ignore-scripts --fetch-retries=0 --fetch-timeout=10000 --cache=/private/tmp/dayflow-security-npm-cache`는 `registry.npmjs.org`의 `ENOTFOUND`로 실패했습니다. `package-lock.json`은 생성되지 않았고, 실제 설치본은 아직 Start `1.168.51`·Router `1.170.34`·서버 코어 `1.169.33`입니다.
- 수정 버전을 설치하지 못했으므로 이번 작업에서 업데이트 후 통합 테스트·빌드 성공 또는 Vercel 배포 성공을 확인하지 않았습니다.
- 남은 작업: 네트워크가 가능한 환경에서 README의 `npm install`과 설치 트리 확인 → 타입·단위·통합·Vercel 빌드 검증 → 생성한 lockfile과 변경 파일 커밋·푸시 → 재배포.

## 배포 첫 접속 HTTPError 500 조사와 인증 초기화 수정

사용자가 보고한 JSON은 처리되지 않은 서버 예외의 일반 응답이므로 실제 Vercel 원인은 런타임 오류와 스택 없이 확정할 수 없습니다. 로컬 빌드 산출물에서 운영 인증 설정이 없으면 보호 페이지의 세션 조회가 실패하는 것을 확인했습니다. Vercel 빌드에는 기존 `prestart`의 운영 설정 검사가 연결돼 있지 않았습니다. 이 두 경로를 수정하고, 인증 실패를 추적할 서버 로그와 운영 모드 회귀 검증을 추가했습니다.

### 이번 작업의 변경 파일과 코드

| 파일 | 구분 | 실제 추가·수정·삭제 코드 |
| --- | --- | --- |
| [src/server/auth/config.server.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/auth/config.server.ts:1) | 추가 | `required`, `getAuthConfigurationIssues(env)`로 필수 설정·공백·비밀키 길이·공개 URL·운영 local 저장 모드를 검사하고 값 대신 필드 이름 반환 |
| [src/server/auth/config.server.test.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/auth/config.server.test.ts:1) | 추가 | 정상·누락·공백·짧은 키·잘못된 URL·운영 local 거절·개발 HTTP 허용을 다루는 단위 테스트 6개 |
| [src/server/auth/auth.server.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/auth/auth.server.ts:32) | 수정 | `withAuth`의 기존 단순 환경변수 조건문을 공통 검사로 교체. 초기화 오류 로그와 재전파 추가. `getSession`은 Better Auth 세션 쿠키가 없으면 `null`을 반환해 OAuth·DB 초기화 생략. 쿠키가 있으면 기존 검증을 유지하고 실패 상태 기록 |
| [src/server/functions/auth.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/functions/auth.ts:12) | 수정 | `getAuthMode.googleConfigured`의 일부 환경변수 존재 검사식을 삭제하고 `getAuthConfigurationIssues().length === 0` 재사용. 누락된 URL·짧은 비밀키도 비활성화에 반영 |
| [scripts/check-production.mjs](/Users/leewoonhee/Project/tts/ticktick-copy/scripts/check-production.mjs:10) | 수정 | 공백 값, 운영 URL의 HTTPS·origin 형식 검증 추가. 설정값을 출력하지 않고 기존 필드별 오류 형식 유지 |
| [scripts/integration.mjs](/Users/leewoonhee/Project/tts/ticktick-copy/scripts/integration.mjs:10) | 수정 | `production` CLI 분기, 운영 모드 별도 프로세스, 첫 방문 리다이렉트 체인·로그인 SSR·접근 차단·위조 쿠키·로그 검증 11개 추가. 기존 로컬 흐름 26개 유지. 프레임워크 오류 역직렬화를 위해 `defaultSerovalPlugins` 사용 |
| [package.json](/Users/leewoonhee/Project/tts/ticktick-copy/package.json:15) | 수정 | `scripts["test:integration:production"]` 추가. 이번 작업에서 의존성 버전은 변경하지 않음 |
| [vercel.json](/Users/leewoonhee/Project/tts/ticktick-copy/vercel.json:3) | 수정 | `buildCommand`의 Nitro 빌드 전에 `npm run verify:production` 실행하도록 연결 |
| [.github/workflows/check.yml](/Users/leewoonhee/Project/tts/ticktick-copy/.github/workflows/check.yml:20) | 수정 | CI에 운영 첫 방문 회귀 검증 명령 추가 |
| [README.md](/Users/leewoonhee/Project/tts/ticktick-copy/README.md:121) | 수정 | 500 진단, Vercel 운영 환경변수, 재배포 및 신규 검증 절차 설명 |
| [IMPLEMENTATION.md](/Users/leewoonhee/Project/tts/ticktick-copy/IMPLEMENTATION.md:247) | 수정 | 이번 작업의 파일별 변경·영향·검증·배포 원인 확인 한계 기록 |

삭제 파일은 없습니다. 인증 설정 판단을 공통 함수로 추출한 것 외에 UI·도메인 서비스 리팩터링은 없습니다. 이전 보안 버전 업데이트와 테마 변경은 이번 변경 내역에 포함하지 않습니다.

### 핵심 변경

```ts
if (!getCookie('better-auth.session_token') && !getCookie('__Secure-better-auth.session_token'))
  return null
```

이는 쿠키 부재를 비로그인으로 처리할 뿐 인증을 우회하지 않습니다. 쿠키가 있으면 Better Auth 검증을 거치며, 설정 오류를 삼키고 로그인 성공으로 바꾸지 않습니다.

```diff
- "buildCommand": "NITRO_PRESET=vercel npm run build"
+ "buildCommand": "npm run verify:production && NITRO_PRESET=vercel npm run build"
```

### 영향과 남은 작업

- DB·마이그레이션·API 응답 구조 변경 없음. 신규 환경변수 없음.
- 기존 필수 환경변수 검증이 Vercel 빌드에도 적용됩니다. 운영 공개 URL은 경로 없는 HTTPS origin이어야 하며, 누락·잘못된 설정이나 Better Auth 미설치 상태에서는 이제 빌드를 중단합니다.
- 실제 Vercel 설정·로그·배포 URL에 접근하지 않았고, 원격 환경변수 변경·재배포·DB 마이그레이션은 수행하지 않았습니다. 실제 500 원인의 확정과 해결 확인에는 해당 요청의 런타임 로그가 필요합니다.
- 실제 Google OAuth·Neon 연결과 업데이트된 TanStack 의존성 설치는 기존 환경 제한으로 검증하지 못했습니다. 네트워크 가능한 환경에서 의존성 설치, 운영 설정, 빌드·재배포가 남아 있습니다.

### 검증

- 타입 검사, 단위 테스트 37개(assertion 112개), 기존 개발 통합 검증 26개 통과.
- 운영 통합 검증 11개 통과: 자격증명 없는 세션·로그인 SSR, 첫 방문 307→307→200, 운영 로컬 인증 비노출, 작업 공간 접근 차단, 위조 세션 거절, 서버 설정 오류 로그.
- `npm run build` 클라이언트·SSR·Nitro 빌드 통과. 빌드 산출물을 포트 없이 운영 모드로 직접 호출해 첫 방문이 307→307→200으로 로그인 화면에 도달하는 것도 확인했습니다.
- 운영 검사 CLI가 누락 설정·잘못된 URL·짧은 키·로컬 저장 모드를 거절하고 설정값은 출력하지 않는 것을 검증했습니다. 변경 코드의 Prettier 검사 통과.
- 위 검증은 기존 로컬 설치본에 대한 결과입니다. Better Auth 미설치 경고가 있으며, 보안 업데이트 의존성의 실제 설치와 Vercel 배포 성공을 의미하지 않습니다.

## Google 로그인 시작 실패의 응답 처리와 진단 개선

버튼의 기존 catch가 HTTP 오류·설정·DB·네트워크·잘못된 응답을 모두 같은 문구로 표시했습니다. 수동 페이지 이동에 맞춰 `disableRedirect: true`를 명시하고 오류 코드와 문의 코드를 보존하도록 수정했습니다. 사용자의 배포 주소·실제 API 응답·서버 로그를 아직 받지 못했으므로 이번 장애의 단일 원인이나 실제 로그인 성공을 확정하지 않았습니다.

### 이번 작업의 변경 파일과 코드

| 파일 | 구분 | 추가·수정·삭제한 코드와 역할 |
| --- | --- | --- |
| [src/features/auth/google-sign-in.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/auth/google-sign-in.ts:1) | 추가 | `AuthFailureCode`, `SignInRequest`, `GoogleSignInError`, `getGoogleSignInURL`. 수동 리디렉션 POST 요청·안전한 Google URL 검사·원인별 안내·검증한 문의 코드 표시 |
| [src/features/auth/google-sign-in.test.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/features/auth/google-sign-in.test.ts:1) | 추가 | 로그인 요청·성공 주소·설정/DB/네트워크 오류·잘못된 응답·비 Google 주소 거절·서버 상세 미노출 테스트 7개 |
| [src/server/auth/failure.server.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/auth/failure.server.ts:1) | 추가 | `AuthConfigurationError`, `classifyAuthFailure`로 cause 체인의 설정·모듈·PostgreSQL·네트워크 코드 분류. `authFailureResponse`로 안전한 오류 응답 생성. `withAuthResponseHeaders`로 변경 불가능한 응답도 쿠키·Location·본문을 보존하며 헤더 적용 |
| [src/server/auth/failure.server.test.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/auth/failure.server.test.ts:1) | 추가 | 중첩·순환 cause 처리, 오류 응답 필드·캐시 금지, immutable redirect 및 여러 Set-Cookie 보존 테스트 5개 |
| [src/server/auth/auth.server.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/auth/auth.server.ts:38) | 수정 | `withAuth`의 일반 설정 예외를 `AuthConfigurationError`로 교체. 기존 세션 검증과 설정 오류 메시지 유지 |
| [src/routes/api.auth.$.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/api.auth.$.ts:9) | 수정 | `handle`에 요청 ID·구체적인 실패 코드·서버 로그 추가. 로그인 POST의 origin 불일치를 403으로 구분. 원본 헤더 직접 수정 코드를 삭제하고 `withAuthResponseHeaders`로 교체. 콜백 리디렉션의 상태·Location·쿠키 보존 |
| [src/routes/login.tsx](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/login.tsx:44) | 수정 | `google`의 인라인 fetch·URL 처리·일괄 오류 문구를 삭제하고 `getGoogleSignInURL`, `GoogleSignInError.message` 사용. `pending` 해제와 기존 재시도 흐름 유지 |
| [scripts/integration.mjs](/Users/leewoonhee/Project/tts/ticktick-copy/scripts/integration.mjs:142) | 수정 | 실제 인증 HTTP 라우트에서 설정 누락 503·문의 코드 일치·캐시 금지·불일치 origin 403을 검증하는 assertion 4개 추가 |
| [README.md](/Users/leewoonhee/Project/tts/ticktick-copy/README.md:141) | 수정 | 오류 코드별 확인 사항, 접속 origin·콜백 설정, verification 테이블과 초기 마이그레이션의 관계 설명 |
| [IMPLEMENTATION.md](/Users/leewoonhee/Project/tts/ticktick-copy/IMPLEMENTATION.md:298) | 수정 | 이번 작업의 변경 파일·코드·검증·미확정 배포 원인 기록 |

신규 파일 4개, 수정 파일 6개이며 삭제 파일은 없습니다. 로그인 요청·실패 응답을 작은 공통 함수로 분리했으며 화면 디자인·다른 도메인 기능은 변경하지 않았습니다.

### 핵심 코드

```ts
body: JSON.stringify({
  provider: 'google',
  disableRedirect: true,
  callbackURL,
  errorCallbackURL: '/login?error=oauth',
})
```

오류 원문을 클라이언트에 보내지 않고 분류한 코드와 로그를 연결할 ID를 보냅니다.

```ts
{ error: 'Authentication is temporarily unavailable', code, requestId }
```

### 영향과 남은 작업

- DB·스키마·마이그레이션·환경변수·의존성 변경 없음. 원격 DB 마이그레이션·환경변수 설정·배포는 실행하지 않았습니다.
- 인증 실패 응답에 `code`, `requestId`, `X-Request-ID`가 추가됩니다. 로그인 시작 API의 공급자 오류는 앱 오류 코드로 정규화하며 자체 로그인 클라이언트도 함께 수정했습니다. 기존 `error` 필드와 HTTP 실패 상태는 유지합니다.
- 세션·쿠키·CSRF 검증은 유지합니다. 임의 Preview origin을 자동 허용하지 않습니다. 쿠키가 없다는 이유로 로그인 성공 처리하지 않습니다.
- [Better Auth 1.4.18의 구현](https://github.com/better-auth/better-auth/blob/v1.4.18/packages/better-auth/src/state.ts)은 DB 어댑터 사용 시 Google 이동 전에 verification 레코드를 만듭니다. 인증 테이블이 없다면 이 단계에서 실패할 수 있으므로 초기 마이그레이션 적용 여부가 확인 대상입니다. 사용자 배포의 실제 원인으로 확정한 것은 아닙니다.
- 남은 작업: 실제 배포 URL과 `/api/auth/sign-in/social`의 응답·동일 문의 코드의 서버 로그로 원인 확정. `BETTER_AUTH_URL` 및 Google 콜백·Neon 스키마를 확인하고 실제 OAuth 왕복 검증.

### 검증

- 타입 검사 통과. 전체 단위 테스트 49개(assertion 154개) 통과.
- 기존 개발 통합 검증 26개, 운영 통합 검증 15개 통과.
- `NITRO_PRESET=vercel npm run build` 통과. 생성된 Vercel 함수 entry를 직접 호출해 설정 누락 503·origin 불일치 403·문의 코드의 응답/로그 일치를 확인했습니다.
- Prettier와 `git diff --check` 통과. 점검용 생성 산출물은 소스 변경에 포함하지 않습니다.
- npm 레지스트리는 여전히 `ENOTFOUND`여서 Better Auth 설치를 완료하지 못했습니다. 위 테스트·빌드는 기존 로컬 TanStack 설치본에 대한 결과이며, 실제 Better Auth·Google·Neon의 로그인 성공을 검증한 결과는 아닙니다.

## Better Auth 내부 500의 원본 예외 전달 보완

사용자가 보낸 `Sign-in failed`·`status: 500` 로그로 Better Auth 핸들러가 500 응답을 반환한 경로를 확인했습니다. 외부 catch는 실행되지 않아 내부 예외의 SQLSTATE 등이 기존 분류기에 전달되지 않았습니다. [고정 버전 1.4.18의 공식 구현](https://github.com/better-auth/better-auth/blob/v1.4.18/packages/better-auth/src/api/index.ts)에 따라 `onAPIError.throw`를 활성화해 앱의 오류 처리기로 원본 예외를 전달하도록 변경했습니다. 실제 배포 장애의 원인과 로그인 성공은 아직 확정하지 않았습니다.

### 이번 작업의 변경 파일과 코드

| 파일 | 구분 | 실제 변경한 코드 |
| --- | --- | --- |
| [src/server/auth/auth.server.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/auth/auth.server.ts:62) | 수정 | `withAuth`의 Better Auth 옵션에 `onAPIError: { throw: true }` 추가. 전체 예외 출력은 `describeAuthFailure`의 제한된 진단으로 교체. `getSession`은 내부 예외를 일반 세션 검증 오류로 교체해 SSR·서버 함수에 DB 원문이 노출되지 않도록 처리 |
| [src/server/auth/failure.server.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/auth/failure.server.ts:11) | 수정 | cause 탐색을 `errorChain`으로 추출. `authFailureStatus`로 공급자 4xx/5xx 상태 보존. `classifyAuthFailure`에 OAuth state 저장 실패와 4xx 분류 추가. `describeAuthFailure`에 driverCodes·errorNames·인증 테이블 이름만 허용 |
| [src/routes/api.auth.$.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/routes/api.auth.$.ts:62) | 수정 | `handle`의 catch에서 요청 ID와 내부 진단을 함께 기록. 일률적인 503 대신 `authFailureStatus(error)` 사용 |
| [src/server/auth/failure.server.test.ts](/Users/leewoonhee/Project/tts/ticktick-copy/src/server/auth/failure.server.test.ts:12) | 수정 | 4xx 상태 보존·500 내부 SQLSTATE 분류·원문/비밀 값 제외·순환/알 수 없는 상태 테스트 4개 추가 |
| [scripts/integration.mjs](/Users/leewoonhee/Project/tts/ticktick-copy/scripts/integration.mjs:137) | 수정 | 세션 조회의 실패 기대값을 `Session validation failed`로 변경해 내부 설정 예외를 직접 직렬화하지 않는 동작 검증 |
| [README.md](/Users/leewoonhee/Project/tts/ticktick-copy/README.md:158) | 수정 | 내부 500 전달 방식과 새 로그 필드, SQLSTATE 확인 절차 설명 |
| [IMPLEMENTATION.md](/Users/leewoonhee/Project/tts/ticktick-copy/IMPLEMENTATION.md:352) | 수정 | 이번 작업의 변경·검증·원인 미확정 상태 기록 |

신규·삭제 파일은 없습니다. cause 탐색만 공통 함수로 정리했으며 이전 로그인 UI·OAuth 요청 변경은 이번 변경에 포함하지 않습니다.

### 핵심 코드

```ts
onAPIError: { throw: true }
```

```ts
console.error('[dayflow:auth] Handler failed', {
  requestId, path, ...describeAuthFailure(error),
})
return authFailureResponse(code, authFailureStatus(error), requestId)
```

### 영향과 남은 작업

- DB·스키마·마이그레이션·환경변수·의존성·공개 오류 응답 필드 변경 없음.
- 내부 오류가 HTTP 처리기로 전파되므로 원래 401·403·429 등은 유지하고, 내부 DB 원인이 있으면 세분화된 앱 오류 코드가 반환됩니다. 세션 조회는 일반 검증 실패로 처리해 내부 원문을 노출하지 않습니다.
- 앱 진단 로그는 오류 메시지·SQL·파라미터·환경변수 값·쿠키를 기록하지 않습니다. SQLSTATE·오류 타입·미리 허용한 인증 테이블 이름만 기록합니다.
- 실제 원인의 확정과 장애 복구는 남아 있습니다. 새 배포의 `Handler failed` 로그에 있는 `driverCodes`, `errorNames`, `tables` 및 Neon 초기 마이그레이션 적용 여부가 필요합니다. 원격 설정·DB 변경·배포는 실행하지 않았습니다.

### 검증

- 타입 검사와 단위 테스트 53개(assertion 171개) 통과.
- 개발 통합 검증 26개, 운영 통합 검증 15개 통과.
- Vercel 대상 빌드, 변경 코드 Prettier, `git diff --check` 통과.
- SQLSTATE가 중첩된 예외에서 보존되고, 4xx가 503으로 바뀌지 않으며, 진단 객체에 원문·비밀 값이 포함되지 않는 것을 검증했습니다.
- Better Auth 미설치와 기존 TanStack 로컬 설치본 제한은 유지됩니다. 실제 Better Auth 오류 훅 실행과 Google·Neon OAuth 왕복은 검증하지 못했으며, 고정 버전 공식 소스로 옵션 동작을 확인했습니다. 빌드 산출물은 소스 변경에 포함하지 않습니다.
