"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { revalidatePath } from "next/cache";
import type { Character } from "@/lib/characters/types";

type ActionResult = { error: string } | { success: true; character: Character };

/**
 * Atualiza hp_atual e/ou sanidade_atual de uma ficha (modo sessão).
 * Só o dono da ficha ou o CRIADOR conseguem gravar — reforçado pela
 * policy "characters_update" já existente (0002), que é a mesma usada
 * para o resto da ficha. Não há policy nova para isto: hp_atual e
 * sanidade_atual são só mais colunas de "characters".
 *
 * Os valores não são limitados a [0, máximo] aqui de propósito (ver nota
 * na migration 0012 — permite HP temporário acima do máximo); a UI é que
 * trata da experiência de "não deixar ir abaixo de 0" com os botões +/-.
 */
export async function atualizarRecursosSessao(
  characterId: string,
  valores: { hp_atual?: number; sanidade_atual?: number }
): Promise<ActionResult> {
  const current = await getCurrentUser();
  if (!current) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const payload: Record<string, number> = {};
  if (valores.hp_atual !== undefined) {
    payload.hp_atual = Math.round(valores.hp_atual);
  }
  if (valores.sanidade_atual !== undefined) {
    payload.sanidade_atual = Math.round(valores.sanidade_atual);
  }
  if (Object.keys(payload).length === 0) {
    return { error: "Nada para atualizar." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("characters")
    .update(payload)
    .eq("id", characterId)
    .select("*")
    .maybeSingle<Character>();

  if (error) {
    return { error: "Não foi possível guardar. Tenta novamente." };
  }
  if (!data) {
    return { error: "Não tens permissão para alterar esta ficha." };
  }

  revalidatePath(`/fichas/${characterId}`);
  return { success: true, character: data };
}

export type Recurso = {
  id: string;
  character_id: string;
  nome: string;
  valor_atual: number;
  valor_maximo: number;
  ordem: number;
  created_at: string;
  updated_at: string;
};

type RecursoActionResult = { error: string } | { success: true; recurso: Recurso };

export async function criarRecurso(
  characterId: string,
  nome: string,
  valorMaximo: number
): Promise<RecursoActionResult> {
  const current = await getCurrentUser();
  if (!current) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const nomeTratado = nome.trim();
  if (!nomeTratado) {
    return { error: "O recurso precisa de um nome." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("character_recursos")
    .insert({
      character_id: characterId,
      nome: nomeTratado,
      valor_maximo: Math.max(0, Math.round(valorMaximo)),
      valor_atual: Math.max(0, Math.round(valorMaximo)),
    })
    .select("*")
    .maybeSingle<Recurso>();

  if (error) {
    return { error: "Não foi possível criar o recurso." };
  }
  if (!data) {
    return { error: "Não tens permissão para adicionar recursos a esta ficha." };
  }

  revalidatePath(`/fichas/${characterId}`);
  return { success: true, recurso: data };
}

export async function atualizarRecurso(
  recursoId: string,
  characterId: string,
  valores: { valor_atual?: number; valor_maximo?: number; nome?: string }
): Promise<RecursoActionResult> {
  const current = await getCurrentUser();
  if (!current) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const payload: Record<string, number | string> = {};
  if (valores.valor_atual !== undefined) {
    payload.valor_atual = Math.round(valores.valor_atual);
  }
  if (valores.valor_maximo !== undefined) {
    payload.valor_maximo = Math.max(0, Math.round(valores.valor_maximo));
  }
  if (valores.nome !== undefined) {
    const nomeTratado = valores.nome.trim();
    if (!nomeTratado) {
      return { error: "O recurso precisa de um nome." };
    }
    payload.nome = nomeTratado;
  }
  if (Object.keys(payload).length === 0) {
    return { error: "Nada para atualizar." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("character_recursos")
    .update(payload)
    .eq("id", recursoId)
    .select("*")
    .maybeSingle<Recurso>();

  if (error) {
    return { error: "Não foi possível guardar o recurso." };
  }
  if (!data) {
    return { error: "Não tens permissão para editar este recurso." };
  }

  revalidatePath(`/fichas/${characterId}`);
  return { success: true, recurso: data };
}

export async function apagarRecurso(
  recursoId: string,
  characterId: string
): Promise<{ error?: string }> {
  const current = await getCurrentUser();
  if (!current) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("character_recursos")
    .delete()
    .eq("id", recursoId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "Não foi possível apagar o recurso." };
  }
  if (!data) {
    return { error: "Não tens permissão para apagar este recurso." };
  }

  revalidatePath(`/fichas/${characterId}`);
  return {};
}
