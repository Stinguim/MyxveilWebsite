import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para usar em Server Components, Route Handlers e Server Actions.
 * Lê/escreve cookies de sessão através da API `cookies()` do Next.js.
 *
 * Nota: chamar `.set()` a partir de um Server Component (não Action/Route Handler)
 * lança um erro silencioso que o Next ignora — é esperado, porque a sessão
 * já é refrescada no middleware.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado a partir de um Server Component — ignorado porque
            // o middleware já trata do refresh de sessão.
          }
        },
      },
    }
  );
}
