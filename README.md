# Dayflow

「TanStack Start 할 일 서비스 개발 구현 기획서」의 1차 출시 범위를 구현한 한국어 개인 작업 관리 앱입니다. Inbox에서 만든 같은 할 일을 오늘·다가오는 일정·월간 캘린더에서 관리합니다. 2차 기능인 반복 일정과 알림은 이번 구현에 포함하지 않습니다.

## 로컬 실행

Node.js 22.12 이상과 테스트용 Bun이 필요합니다.

```bash
npm install
cp .env.example .env
npm run dev
```

`http://localhost:3100`에서 **로컬에서 시작**을 선택합니다. 기본 저장 위치는 `.data/dayflow.json`입니다. 계정과 샘플 작업을 미리 만들지 않으며, 첫 로그인에서 빈 개인 워크스페이스와 Inbox를 생성합니다. 개발 서버를 재시작하면 로컬 로그인 쿠키가 무효화되므로 다시 로그인하면 됩니다. 저장된 작업은 유지됩니다.

로컬 모드는 개발 환경에서만 허용합니다. `npm start`와 배포 빌드에서는 Neon 및 Google OAuth 설정이 필요합니다. 로컬 모드는 Google 로그인이나 클라우드 동기화를 제공하지 않습니다.

이번 구현 환경에서는 레지스트리 DNS와 포트 바인딩이 제한되었습니다. 검증은 이미 설치된 로컬 의존성으로 수행했으며, Better Auth 패키지는 설치하지 못했습니다. 다른 환경에서는 반드시 `npm install`을 실행한 뒤 `package-lock.json`을 생성·검토하고 버전 관리에 포함하세요. 로컬 의존성 경로는 소스나 실행 설정에 하드코딩하지 않았습니다.

## 구현된 기능

- Google OAuth 핸들러·세션 보호 경계와 개발용 로컬 로그인
- 개인 워크스페이스·Inbox 초기화, 일반 리스트·섹션·태그 생성
- 한글 IME 조합을 고려한 빠른 추가와 재시도 요청 ID 유지
- 제목·본문·우선순위·태그·리스트·섹션·종일 및 시각 일정 편집
- 오늘의 기한 초과·오늘·오늘 완료 그룹, 내일부터 7일인 다가오는 일정
- 완료와 취소, 휴지통 이동·복원, 완료·삭제 토스트 되돌리기
- 월요일 시작 월간 달력, 기간 겹침 조회, 날짜 선택, 일정 드래그 이동
- 날짜 미정 작업 배치와 키보드 날짜 메뉴, 일반 리스트의 수동 순서 드래그
- `?task=ID`, `?month=YYYY-MM`, 검색·태그·우선순위·정렬 URL 상태
- 모바일 탐색·상세 Sheet, 오류·빈 목록·로딩, 변경 충돌 시 초안 유지
- 시간대 설정, 자정 이후와 창 재활성화 시 오늘 목록 갱신

상태는 Router의 경로·검색 조건, Query의 서버 데이터, React의 입력 초안, Zustand의 공유 탐색 패널 상태로 구분했습니다. 서버는 TanStack Start의 GET 읽기·POST 변경 함수로 구성하며 별도 Elysia 서버는 사용하지 않습니다.

## 저장과 데이터 무결성

서버 함수 → Zod 입력 검증 → 세션 및 워크스페이스 확인 → `TaskService` → 저장소 트랜잭션 순서입니다. 권한이 없는 ID는 `NOT_FOUND`로 처리합니다. 같은 요청 키·내용은 저장된 첫 결과를 반환하고, 같은 키의 다른 내용은 거절합니다. `expectedVersion`이 현재 버전과 다르면 `VERSION_CONFLICT`를 반환합니다. 수정 초안은 실제 바뀐 필드만 전송합니다.

Neon 저장소는 Drizzle의 WebSocket 어댑터와 대화형 트랜잭션을 사용합니다. 워크스페이스 행을 `FOR UPDATE`로 잠가 초기화·순서 이동·버전 확인·요청 영수증 저장을 직렬화합니다. 개인 워크스페이스 소유자, Inbox, 태그 이름, 요청 키의 고유성과 교차 워크스페이스 참조를 스키마에서 제한합니다. 연결 풀은 작업 후 닫습니다.

현재 개인용 초기 구현은 워크스페이스 데이터를 읽어 서비스에서 필터링합니다. 큰 데이터셋으로 확장하기 전 서버 조회 조건·커서 처리를 SQL 쿼리 수준으로 이동하고, 변경된 행만 저장하도록 최적화해야 합니다. 현재 도메인의 목록 API는 페이지 커서를 제공하지만 화면은 작업 공간 쿼리를 공유합니다.

종일 일정은 종료 미포함 SQL `date`, 시각 일정은 `timestamptz`와 IANA 시간대로 저장합니다. DST 날의 실제 자정 경계와 다일 일정의 겹침을 사용하며, 캘린더 이동은 현지 시각과 실제 기간 길이를 유지합니다. 존재하지 않는 DST 시각의 직접 입력은 오류로 안내합니다. 반복 규칙에 대한 DST 보정 정책은 2차 범위입니다.

## Neon과 Google OAuth 연결

`.env`에서 다음을 설정합니다. 실제 비밀 값은 저장소에 커밋하지 않습니다.

| 환경변수                                   | 용도                                       |
| ------------------------------------------ | ------------------------------------------ |
| `APP_STORAGE=postgres`                     | Neon 저장 모드                             |
| `DATABASE_URL`                             | 런타임 최소 권한의 Neon pooled URL         |
| `DATABASE_URL_DIRECT`                      | 마이그레이션용 직접 연결 URL               |
| `BETTER_AUTH_SECRET`                       | 32자 이상 인증 비밀                        |
| `BETTER_AUTH_URL`                          | 환경별 공개 앱 주소                        |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth 공급자                        |
| `LOCAL_DATA_FILE`                          | 개발용 로컬 파일 경로, 운영에서 사용 안 함 |

Google에 환경별 콜백 `https://앱도메인/api/auth/callback/google`을 등록합니다. 로컬 OAuth 테스트는 `http://localhost:3100/api/auth/callback/google`을 등록합니다. 인증 핸들러는 `/api/auth/$`에 연결되며, 세션 쿠키는 HttpOnly·SameSite와 운영 Secure 설정을 사용합니다. 사용자 응답은 `private, no-store`, POST 서버 함수는 명시적인 CSRF 미들웨어를 사용합니다.

```bash
npm run db:generate
# 생성된 SQL 및 스냅샷 검토 후, 올바른 개발 DB에만 적용
npm run db:migrate
npm run verify:production
npm run build
npm start
```

초기 마이그레이션은 `drizzle/0000_handy_arclight.sql`입니다. 실제 DB에는 자동 적용하지 않았습니다. `verify:production`은 환경변수와 패키지 존재만 검사하며, 실제 DB 연결·OAuth 성공을 보장하지 않습니다. Nitro 빌드는 설치된 Better Auth 런타임 의존성을 출력에 추적하도록 구성했습니다.

## 검증

```bash
npm run typecheck
npm test
npm run test:integration
npm run build
```

단위 테스트는 날짜·DST·기간 경계, 워크스페이스 격리, 동시 Inbox 초기화, 재시도, 버전 충돌, 복원, 정렬, 태그 정규화와 목록 간 동일성을 검증합니다. `scripts/integration.mjs`는 포트를 열지 않고 실제 Vite SSR 핸들러에 Request를 전달해 로그인 쿠키·CSRF·서버 함수·목록·캘린더·되돌리기·저장 상태를 검증합니다. 테스트 저장소는 임시 폴더에서 생성하고 정리합니다.

수동 브라우저 검증 흐름:

1. 로컬 로그인 → Inbox에서 할 일 추가 → 상세에서 오늘 지정
2. 오늘과 월간 달력에서 같은 작업 확인 → 달력에서 내일로 이동
3. 다가오는 일정에서 완료 → 되돌리기 → 새로고침
4. 두 탭에서 같은 작업 수정 → 충돌 안내와 입력 초안 유지 확인
5. 작은 화면에서 Sheet, 키보드 탐색·날짜 변경, 한글 조합 Enter 확인

이 환경에서는 포트 바인딩 제한으로 실제 브라우저 클릭·드래그·시각 검증을 수행하지 못했습니다. OAuth·Neon 트랜잭션·Vercel 프리뷰도 외부 자격증명 없이 검증하지 않았습니다.

## 배포와 남은 범위

Vercel 프로젝트에서 `vercel.json`의 Nitro 빌드 설정을 사용하고 환경별 Neon과 OAuth 값을 등록하세요. PR 검증 워크플로를 추가했으며 원격 실행·배포는 하지 않았습니다. 마이그레이션은 별도 CI 권한으로 검토 후 한 번 적용하세요.

### TanStack Start 보안 업데이트와 Vercel E403

`@tanstack/start-server-core@1.169.33` 다운로드 시 발생하는 Vercel E403은 [CVE-2026-102989 보안 차단](https://github.com/TanStack/router/security/advisories/GHSA-qx66-fv34-fjm8)입니다. `@tanstack/react-start`를 수정 버전 `1.168.60`으로, `@tanstack/react-router`를 같은 릴리스의 `1.170.41`로 올렸습니다. npm `overrides`는 중첩 의존성의 `@tanstack/start-server-core`도 수정 버전 `1.169.39`를 사용하게 합니다.

레지스트리에 접근 가능한 환경에서 다음을 실행하세요.

```bash
npm install
npm ls @tanstack/react-start @tanstack/react-router @tanstack/start-server-core --all
npm run typecheck
npm test
npm run test:integration
NITRO_PRESET=vercel npm run build
```

출력의 모든 `@tanstack/start-server-core`가 `1.169.39`인지 확인하고, 변경한 `package.json`과 생성된 `package-lock.json`을 함께 커밋·푸시한 뒤 Vercel에서 재배포하세요. 이전 버전이 계속 설치되면 새 커밋이 배포 대상인지 확인하고 기존 빌드 캐시를 사용하지 않고 재배포하세요. 취약 버전 배포를 허용하는 환경변수는 설정하지 않습니다.

이 작업 환경에서는 npm 레지스트리 DNS 접근이 차단되어 업데이트 설치·lockfile 생성·수정 버전의 빌드를 완료하지 못했습니다. 기존 설치본으로 수행한 검증은 수정 버전 프레임워크의 검증을 대신하지 않습니다.

2차 범위: 반복 규칙·회차 예외·주간 캘린더·칸반·인앱/이메일 알림·보호된 디스패치 엔드포인트·선점과 재시도 워커. `CRON_SECRET`, `EMAIL_API_KEY`, `EMAIL_FROM`은 예시만 있으며 이번 구현에서 사용하지 않습니다. 공유·첨부·오프라인 동기화 등은 기획서의 후속 단계입니다.

## 주요 파일

- `src/routes/`: 보호 레이아웃, 로그인, 목록·달력과 인증 HTTP 라우트
- `src/features/tasks/`: 입력·상세·목록·일정 UI, 스키마·선택자·초안 변경 추출
- `src/features/calendar/`: 월간 캘린더와 날짜 미정 작업 배치
- `src/server/functions/`: 형식화된 서버 함수와 공개 오류 계약
- `src/server/services/`: 요청 영수증·버전·권한을 적용하는 비즈니스 로직
- `src/server/repositories/`: Neon 트랜잭션과 개발용 파일 저장소
- `src/db/schema/`, `drizzle/`: 인증·워크스페이스·할 일·일정·태그 스키마와 마이그레이션
- `src/components/ui/`: Radix 기반 shadcn/ui 스타일 공통 컴포넌트
- `scripts/`: 실제 서버 핸들러 통합 검증과 운영 설정 점검

## 참고 문서

- [TanStack Start 서버 함수](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
- [TanStack Start 서버 라우트](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes)
- [Better Auth TanStack Start 통합](https://www.better-auth.com/docs/integrations/tanstack)
- [Drizzle Neon 연결](https://orm.drizzle.team/docs/connect-neon)
