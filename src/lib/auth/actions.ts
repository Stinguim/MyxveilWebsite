"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export type ActionResult = { error: string } | never;

/**
 * Devolve a origem (protocolo + host) do pedido atual, para construir
 * URLs de redirect absolutos que funcionam tanto em localhost como em
 * produção, sem precisar de configurar uma env var à parte.
 */
async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function loginComEmail(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Preenche o email e a password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email ou password incorretos." };
  }

  redirect("/fichas");
}

export async function registarComEmail(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmarPassword = String(formData.get("confirmarPassword") ?? "");

  if (!email || !password) {
    return { error: "Preenche o email e a password." };
  }

  if (password.length < 8) {
    return { error: "A password tem de ter pelo menos 8 caracteres." };
  }

  if (password !== confirmarPassword) {
    return { error: "As passwords não coincidem." };
  }

  const origin = await getOrigin();
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Já existe uma conta com este email." };
    }
    return { error: "Não foi possível criar a conta. Tenta novamente." };
  }

  redirect("/registo/confirma-o-teu-email");
}

export async function loginComDiscord() {
  const origin = await getOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: `${origin}/auth/callback?next=/fichas`,
    },
  });

  if (error || !data.url) {
    redirect("/auth/auth-error");
  }

  redirect(data.url);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
