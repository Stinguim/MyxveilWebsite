import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para usar em Client Components ("use client").
 * Usa as chaves públicas (anon key) — seguro para expor no browser,
 * pois toda a segurança é garantida pelas políticas de Row Level Security (RLS).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
