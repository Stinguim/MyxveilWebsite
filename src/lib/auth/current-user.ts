import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type UserRole = "criador" | "jogador";

export type Profile = {
  id: string;
  role: UserRole;
  nome_alcunha: string | null;
  discord_username: string | null;
  experiencia_rpg:
    | "nunca_jogou"
    | "algumas_vezes"
    | "varias_vezes"
    | "regular"
    | null;
  created_at: string;
  updated_at: string;
};

export type CurrentUser = {
  user: User;
  profile: Profile;
};

/**
 * Devolve o utilizador autenticado e o respetivo perfil (incluindo role),
 * ou null se não houver sessão. Uso em Server Components/Route Handlers.
 *
 * Nota: usa getUser() (não getSession()) porque este valida o token contra
 * o servidor de Auth em vez de confiar cegamente no cookie.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return { user, profile: profile as Profile };
}

export async function isCriador(): Promise<boolean> {
  const current = await getCurrentUser();
  return current?.profile.role === "criador";
}
