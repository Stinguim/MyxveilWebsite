"use server";

import { createClient } from "@/lib/supabase/server";
import { isCriador } from "@/lib/auth/current-user";
import { revalidatePath } from "next/cache";

export type TipoNoMapa = "personagem" | "grupo";

export type NodePosition = {
  id: string;
  tipo: TipoNoMapa;
  ref_id: string;
  x: number;
  y: number;
  updated_at: string;
};

/**
 * Guarda (upsert) a posição de um nó do mapa ao ser largado depois de um
 * drag. Chamado automaticamente pelo grafo — sem botão "Guardar"
 * explícito, para a experiência ser "arrastei, ficou guardado".
 *
 * on_conflict na constraint única (tipo, ref_id) garante que voltar a
 * arrastar o mesmo nó atualiza a posição em vez de criar duplicados.
 */
export async function guardarPosicaoNo(
  tipo: TipoNoMapa,
  refId: string,
  x: number,
  y: number
): Promise<{ error: string } | { success: true }> {
  if (!(await isCriador())) {
    return { error: "Não tens permissão para reorganizar o mapa." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("node_positions")
    .upsert(
      { tipo, ref_id: refId, x, y },
      { onConflict: "tipo,ref_id" }
    );

  if (error) {
    return { error: "Não foi possível guardar a posição do nó." };
  }

  revalidatePath("/mapa");
  revalidatePath("/admin/mapa");
  return { success: true };
}

/**
 * Apaga todas as posições guardadas — o mapa volta a usar o layout
 * automático calculado no cliente (grelha/linha, ver calcularLayout em
 * grafo-relacoes.tsx).
 */
export async function reporLayoutAutomatico(): Promise<{ error?: string }> {
  if (!(await isCriador())) {
    return { error: "Não tens permissão para repor o layout do mapa." };
  }

  const supabase = await createClient();
  // delete sem .eq/.match explícito recusa por segurança no PostgREST;
  // usamos uma condição sempre verdadeira (neq um valor impossível) para
  // apagar toda a tabela de forma explícita e intencional.
  const { error } = await supabase
    .from("node_positions")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    return { error: "Não foi possível repor o layout automático." };
  }

  revalidatePath("/mapa");
  revalidatePath("/admin/mapa");
  return {};
}
