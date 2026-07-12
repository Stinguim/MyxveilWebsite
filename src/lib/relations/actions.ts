"use server";

import { createClient } from "@/lib/supabase/server";
import { isCriador } from "@/lib/auth/current-user";
import { revalidatePath } from "next/cache";
import type { CharacterRelation, Group, TipoRelacao } from "@/lib/relations/types";

type ActionResult<T> = { error: string } | { success: true; data: T };

// ----------------------------------------------------------------------------
// Grupos
// ----------------------------------------------------------------------------

export async function criarGrupo(
  nome: string,
  descricao: string
): Promise<ActionResult<Group>> {
  if (!(await isCriador())) {
    return { error: "Não tens permissão para criar grupos." };
  }

  const nomeTratado = nome.trim();
  if (!nomeTratado) {
    return { error: "O grupo precisa de um nome." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .insert({ nome: nomeTratado, descricao: descricao.trim() || null })
    .select("*")
    .maybeSingle<Group>();

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um grupo com esse nome." };
    }
    return { error: "Não foi possível criar o grupo." };
  }
  if (!data) {
    return { error: "Não tens permissão para criar grupos." };
  }

  revalidatePath("/mapa");
  revalidatePath("/admin/mapa");
  return { success: true, data };
}

// ----------------------------------------------------------------------------
// Relações (arestas)
// ----------------------------------------------------------------------------

type CriarRelacaoInput = {
  characterAId: string;
  /** Exatamente um dos dois tem de vir preenchido. */
  characterBId?: string;
  groupBId?: string;
  tipo: TipoRelacao;
  tipoOutro?: string;
  descricao?: string;
};

export async function criarRelacao(
  input: CriarRelacaoInput
): Promise<ActionResult<CharacterRelation>> {
  if (!(await isCriador())) {
    return { error: "Não tens permissão para criar ligações no mapa." };
  }

  if (input.characterAId === input.characterBId) {
    return { error: "Uma personagem não pode ligar-se a si própria." };
  }
  if (!input.characterBId && !input.groupBId) {
    return { error: "Escolhe uma personagem ou um grupo para ligar." };
  }
  if (input.characterBId && input.groupBId) {
    return { error: "Escolhe só uma personagem OU só um grupo, não os dois." };
  }
  if (input.tipo === "outro" && !input.tipoOutro?.trim()) {
    return { error: "Descreve o tipo de relação em 'Outro'." };
  }

  const supabase = await createClient();

  // created_by = utilizador atual — necessário porque a coluna é "not
  // null references profiles(id)" (migration 0003) e não tem default.
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const { data, error } = await supabase
    .from("character_relations")
    .insert({
      character_a_id: input.characterAId,
      character_b_id: input.characterBId ?? null,
      group_b_id: input.groupBId ?? null,
      tipo: input.tipo,
      tipo_outro: input.tipo === "outro" ? input.tipoOutro?.trim() : null,
      descricao: input.descricao?.trim() || null,
      created_by: userData.user.id,
    })
    .select("*")
    .maybeSingle<CharacterRelation>();

  if (error) {
    return { error: "Não foi possível criar a ligação: " + error.message };
  }
  if (!data) {
    return { error: "Não tens permissão para criar ligações no mapa." };
  }

  revalidatePath("/mapa");
  revalidatePath("/admin/mapa");
  return { success: true, data };
}

export async function apagarRelacao(id: string): Promise<{ error?: string }> {
  if (!(await isCriador())) {
    return { error: "Não tens permissão para remover ligações do mapa." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("character_relations")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "Não foi possível remover a ligação." };
  }
  if (!data) {
    return { error: "Não tens permissão para remover esta ligação, ou ela já não existe." };
  }

  revalidatePath("/mapa");
  revalidatePath("/admin/mapa");
  return {};
}
