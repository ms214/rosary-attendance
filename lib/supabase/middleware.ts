import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 로그인 없이 접근 가능한 경로
const PUBLIC_PATHS = ["/login", "/signup"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 세션을 쿠키에서 로컬로 읽고(네트워크 없음), 토큰이 만료 임박일 때만 네트워크 리프레시한다.
  // → 로그인 상태의 매 요청마다 발생하던 인증서버 왕복을 제거해 페이지 이동을 빠르게 한다.
  //   데이터 보안은 Supabase가 쿼리 시 JWT를 검증(RLS)하므로 유지된다.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  let authed = !!session?.user;
  if (session) {
    const expiresInMs = (session.expires_at ?? 0) * 1000 - Date.now();
    if (expiresInMs < 60_000) {
      // 만료 1분 전 이내 → 리프레시 토큰으로 갱신(쿠키 갱신 포함)
      const { data } = await supabase.auth.refreshSession();
      authed = !!data.session;
    }
  }

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some(
    (p) => path === p || path.startsWith(p + "/"),
  );

  if (!authed && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
