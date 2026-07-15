"use server";

import { createClient } from "@/lib/supabase/server";
import type { Group } from "@/lib/characters/types";

/**
 * Lista os grupos existentes (public.groups), ordenados por nome, para
 * popular o select dinâmico de "Grupo a que pertence" na ficha. Leitura
 * livre a qualquer autenticado (RLS: "groups_select_authenticated").
 */
export async function listarGrupos(): Promise<Group[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("groups")
    .select("*")
    .order("nome", { ascending: true });
  return (data ?? []) as Group[];
}
