"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/**
 * Associa uma conta Discord à conta atualmente autenticada (ex: alguém
 * que entrou por email quer também poder entrar por Discord).
 * Requer "Allow manual linking" ativado nas definições de Auth do Supabase.
 */
export async function associarDiscord() {
  const origin = await getOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.linkIdentity({
    provider: "discord",
    options: {
      redirectTo: `${origin}/auth/callback?next=/perfil`,
    },
  });

  if (error || !data.url) {
    redirect("/auth/auth-error");
  }

  redirect(data.url);
}

/**
 * Define ou atualiza a password de email para a conta atual (ex: alguém
 * que entrou só por Discord quer também poder entrar por email/password).
 * Se a conta ainda não tiver email associado, também o define.
 */
export async function associarEmailPassword(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Preenche o email e a password." } as const;
  }

  if (password.length < 8) {
    return { error: "A password tem de ter pelo menos 8 caracteres." } as const;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email, password });

  if (error) {
    return { error: "Não foi possível associar o email. Tenta novamente." } as const;
  }

  revalidatePath("/perfil");
  return { success: true } as const;
}

/**
 * Remove uma identidade associada (ex: desassociar o Discord). O Supabase
 * exige que sobrem pelo menos duas identidades antes de desassociar, para
 * o utilizador nunca ficar sem forma de entrar na conta.
 */
export async function desassociarIdentidade(
  identityId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const { data: identitiesData } = await supabase.auth.getUserIdentities();
  const identities = identitiesData?.identities ?? [];

  if (identities.length < 2) {
    return {
      error:
        "Não podes remover o último método de login. Associa outro método primeiro.",
    } as const;
  }

  const identity = identities.find((i) => i.identity_id === identityId);
  if (!identity) {
    return { error: "Identidade não encontrada." } as const;
  }

  const { error } = await supabase.auth.unlinkIdentity(identity);

  if (error) {
    return { error: "Não foi possível remover esta identidade." } as const;
  }

  revalidatePath("/perfil");
  return { success: true } as const;
}

export type DadosPerfilInput = {
  nome_alcunha: string;
  experiencia_rpg: "nunca_jogou" | "algumas_vezes" | "varias_vezes" | "regular" | "";
};

/**
 * Atualiza os campos da secção 4.1 (identificação do jogador). O username
 * de Discord não é editável aqui — vem automaticamente da identidade OAuth.
 */
export async function atualizarPerfil(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const nome_alcunha = String(formData.get("nome_alcunha") ?? "").trim();
  const experiencia_rpg = String(formData.get("experiencia_rpg") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Inicia sessão novamente." } as const;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      nome_alcunha: nome_alcunha || null,
      experiencia_rpg: experiencia_rpg || null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Não foi possível guardar as alterações." } as const;
  }

  revalidatePath("/perfil");
  return { success: true } as const;
}
