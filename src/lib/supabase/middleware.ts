import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Corre em todos os pedidos (via src/proxy.ts na raiz — convenção do
 * Next.js 16, antigo middleware.ts) para:
 * 1. Refrescar o token de sessão Supabase antes de expirar.
 * 2. Redirecionar utilizadores não autenticados de rotas protegidas para /login.
 *
 * IMPORTANTE: nunca remover a chamada a `supabase.auth.getUser()` — é o que
 * força o refresh do token. Sem isto, as sessões expiram silenciosamente.
 */
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
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isProtectedRoute =
    pathname.startsWith("/fichas") ||
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/admin");

  const isAuthRoute =
    pathname === "/login" || pathname === "/registo";

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/fichas";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
