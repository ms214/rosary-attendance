# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

성당 중고등부 주일학교 학생들이 묵주기도 성월 동안 **매일 묵주기도 후 인증샷을 올려
출석을 체크**하는 모바일 웹 앱. 학생은 이름 선택 + 4자리 PIN으로 로그인 → 사진
업로드로 당일 출석, 오늘의 신비 확인, 가상 묵주로 기도를 진행한다. 교사는 전체 출석 현황을 본다.

## 명령어

```bash
npm run dev     # 개발 서버 (Turbopack)
npm run build   # 프로덕션 빌드 (타입체크 포함)
npm run lint    # ESLint
npm start       # 빌드 결과 실행
```

- 테스트 러너는 아직 없음(단일 테스트 명령 없음). 검증은 `npm run build` + `npm run lint` + 수동 확인.
- 의존성 설치 시 전역 npm 캐시 권한 문제가 있으면 프로젝트 로컬 캐시 사용:
  `npm install --cache ./.npm-cache`

## 필수 외부 설정 (이게 없으면 로그인/업로드가 동작하지 않음)

1. **환경변수**: `cp .env.local.example .env.local` 후 Supabase URL / anon key 입력.
2. **DB 스키마**: `supabase/migrations/` 의 `0001` → `0002` → `0003` → `0004` 를 번호순으로
   Supabase SQL Editor에서 실행. 테이블·RLS·`is_teacher()`·Storage 정책(0001),
   role 자가승격 차단 트리거(0003). ※ 0002는 명단 RPC를 추가했다가 0004에서 제거하므로
   새로 세팅한다면 0002는 건너뛰어도 무방.
3. **이메일 확인 끄기**: Authentication → Sign In / Providers → Email 에서
   **"Confirm email" 비활성화**. (로그인은 합성 이메일 기반이라 확인 메일을 받을 수 없음 —
   켜져 있으면 가입 후 세션이 발급되지 않아 로그인 불가)
4. **교사 지정**: 해당 사용자가 한 번 가입한 뒤
   `update profiles set role='teacher' where name='...' and baptismal_name='...'`
   (0001 SQL 하단에 예시 있음).

## 아키텍처

Next.js 16 (App Router) + React 19 + Tailwind v4 + Supabase(Postgres/Auth/Storage).

### 인증 흐름 — 여러 파일에 걸쳐 있으니 함께 이해할 것

- 로그인은 **이름 선택 + 4자리 PIN**. 실제로는 Supabase 이메일/비밀번호 인증을 쓰되,
  이메일/비밀번호를 학생에게 노출하지 않고 **합성**한다(`lib/synthetic.ts`):
  - `syntheticEmail(name, baptismal)` = 이름+세례명의 SHA-256 → `u<hex>@rosary.local`
    (가입·로그인 양쪽에서 **동일하게** 계산되어야 하므로 이 함수가 유일한 진실원)
  - `pinToPassword(pin)` = PIN을 Supabase 최소 길이(6) 이상의 비밀번호로 변환
- `app/signup/page.tsx` — 이름/세례명/나이/PIN 입력 → `auth.signUp` → `profiles` upsert (한 화면에서 완료).
- `app/login/page.tsx` — **이름·세례명·PIN 직접 입력**(명단 노출 없음) → 합성 이메일/비밀번호로
  `signInWithPassword`. 둘 다 **Client Component**(브라우저 클라이언트가 세션을 쿠키에 저장 →
  서버/proxy가 읽음). ※ 과거의 `list_students()` 공개 RPC는 프라이버시 때문에 제거됨(0004).
- **세션 유지(자동 로그인)**는 `proxy.ts`(구 middleware) → `lib/supabase/middleware.ts`의
  `updateSession()`이 매 요청마다 `getUser()`로 토큰을 갱신하면서 이뤄진다.
  미로그인 사용자는 `/login`으로 리다이렉트(`PUBLIC_PATHS` = `/login`, `/signup` 제외).
- 페이지 단의 가드는 `lib/auth.ts`:
  - `requireProfile()` — 미로그인/프로필 없음→`/login`, 아니면 Profile 반환
  - `requireTeacher()` — 학생이 접근하면 `/`로 돌려보냄
  - 모든 서버 페이지는 이 둘 중 하나로 시작한다.

### Supabase 클라이언트는 3종류 — 용도별로 반드시 구분

- `lib/supabase/client.ts` — 브라우저(Client Component)용
- `lib/supabase/server.ts` — 서버 컴포넌트/서버 액션/라우트 핸들러용 (쿠키 연동, `await`)
- `lib/supabase/middleware.ts` — proxy 전용 세션 갱신 헬퍼
서버 측 쓰기는 모두 **Server Action**으로 처리(`app/**/actions.ts`, `app/actions.ts`).

### 데이터 & 권한 모델

- `profiles`(= auth.users 1:1): name, baptismal_name, age, role.
- `attendances`: `UNIQUE(student_id, attend_date)` → **하루 1건**. 업로드 시 즉시 자동 인정.
- Storage 버킷 `attendance-photos`(비공개). **파일 경로 규칙은 `${auth.uid()}/${날짜}.ext`** —
  RLS(storage.objects)와 `createSignedUrl(s)` 조회가 이 규칙에 의존하므로 바꾸면 정책도 바꿔야 함.
- RLS: 학생은 본인 데이터만, 교사(`is_teacher()`)는 전체 조회. 사진 표시는 서명 URL 사용.

### 도메인 로직 (`lib/rosary.ts`)

- `MYSTERIES` 4종(환희/빛/고통/영광) × 각 5단 묵상 + 기도문 전문(`PRAYERS`).
- `todaysMystery()` — 전통 요일 배정(월·토 환희 / 화·금 고통 / 수·일 영광 / 목 빛).
- `buildRosarySteps(mystery)` — 가상 묵주 전체 순서(도입부→5단→마침)를 step 배열로 생성.
  `app/rosary/page.tsx`가 이 배열을 index로 넘기며 묵주알을 시각화한다.

## 코드 컨벤션 / 주의점

- **날짜는 전부 `lib/date.ts`의 Asia/Seoul 기준 헬퍼로 계산**한다. `new Date()`의 로컬/UTC를
  직접 쓰지 말 것 — 자정 경계에서 출석 날짜가 틀어진다.
- UI는 **모바일 퍼스트**. 전체 화면은 `app-shell`(max-width 28rem)로 폭이 고정되고
  하단 탭은 `components/BottomNav.tsx`(로그인/온보딩 경로에서는 자동 숨김).
- `next.config.ts`에서 Next 16의 `cacheComponents`/`partialPrefetching`을 **의도적으로 끈 상태**.
  쿠키를 읽는 인증 페이지가 많아 전부 동적으로 두는 편이 단순하기 때문. 다시 켜면 Suspense/
  `use cache` 경계를 광범위하게 손봐야 한다.
- 원격 이미지는 서명 URL이라 `next/image` 대신 `<img>`를 쓰고, 해당 줄에 eslint-disable 주석을 단다.
- 라우트 미들웨어 파일은 `proxy.ts`(Next 16 규칙). `middleware.ts`로 되돌리지 말 것.
