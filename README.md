# 📿 묵주기도 성월 출석체크

성당 중고등부 주일학교 학생들이 **묵주기도 성월(10월)** 동안 매일 묵주기도를 바치고,
인증샷을 올려 출석을 체크하는 모바일 웹 서비스입니다.

> 🔗 서비스: https://rosary-eight.vercel.app

## 주요 기능

- **간편 로그인** — 이름·세례명·PIN 4자리로 로그인 (비밀번호·이메일 불필요). 한 번 로그인하면 자동 유지
- **출석 체크** — 묵주기도 후 인증샷 한 장 업로드 **또는 가상 묵주기도 완주** → 당일 출석 자동 인정 (하루 1건)
- **오늘의 신비** — 요일에 맞는 묵주기도 신비를 자동 추천하고 5단 묵상 안내
- **가상 묵주** — 묵주가 없어도 화면의 묵주알을 따라 기도문을 한 단계씩 진행
- **출석 도장판** — 이달의 출석 현황을 달력과 인증샷 썸네일로 확인
- **교사 대시보드** — 학생별·날짜별 출석 매트릭스와 인증샷을 한눈에 확인

## 기술 스택

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** (모바일 퍼스트)
- **Supabase** — Postgres(DB) · Auth · Storage(사진)
- **Vercel** 배포

## 로컬 개발 준비

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수

```bash
cp .env.local.example .env.local
```

`.env.local`에 Supabase 프로젝트 값을 입력합니다.

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Supabase 설정

1. **DB 스키마** — `supabase/migrations/` 의 SQL을 번호순(`0001` → `0003` → `0004` → `0005`)으로
   Supabase SQL Editor에서 실행합니다. (테이블·RLS·Storage 정책·보안 트리거 포함.
   `0002`는 사용하지 않는 RPC를 추가했다가 `0004`에서 제거하므로 새 설정에선 건너뛰어도 됩니다.)
2. **이메일 확인 끄기** — Authentication → Sign In / Providers → Email 에서
   **"Confirm email"을 비활성화**합니다. (로그인은 합성 이메일 기반이라 확인 메일을 받을 수 없음)

### 4. 실행

```bash
npm run dev
```

http://localhost:3000 을 (모바일 화면 크기로) 열어 확인합니다.

## 명령어

```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드 (타입체크 포함)
npm run lint    # ESLint
npm start       # 빌드 결과 실행
```

## 교사 계정 지정

학생이 가입한 뒤, Supabase SQL Editor에서 role을 변경합니다. (보안상 앱에서는 변경 불가)

```sql
update public.profiles
set role = 'teacher'
where name = '홍길동' and baptismal_name = '베드로';
```

## 로그인 방식 (참고)

학생에게는 이메일/비밀번호를 노출하지 않습니다. 내부적으로 Supabase 이메일/비밀번호 인증을
쓰되, **이메일은 `이름+세례명`의 해시값**으로, **비밀번호는 PIN**으로 자동 생성합니다
(`lib/synthetic.ts`). 가입과 로그인 양쪽에서 동일하게 계산됩니다.

## 배포

Vercel에 환경변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)를 등록한 뒤
배포합니다.

```bash
npx vercel --prod
```

---

아키텍처·디렉터리 구조 등 개발 상세는 [`CLAUDE.md`](./CLAUDE.md)를 참고하세요.
