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

  // 유효한 토큰이면 getClaims()로 로컬 검증만 하고(네트워크 없음), 토큰이 없거나
  // 만료됐을 때만 getUser()로 네트워크 리프레시한다(자동 로그인 유지).
  // → 로그인 상태의 매 요청마다 발생하던 인증서버 왕복을 제거해 페이지 이동을 빠르게 한다.
  const { data: claims } = await supabase.auth.getClaims();
  let authed = !!claims?.claims?.sub;
  if (!authed) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authed = !!user;
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
