"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { revalidatePath } from "next/cache";

const BUCKET = "character-art";
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5MB
const TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];

export type ArteItem = {
  id: string;
  character_id: string;
  uploaded_by: string;
  storage_path: string;
  legenda: string | null;
  created_at: string;
};

type ActionResult = { error: string } | { success: true; item: ArteItem };

/**
 * Upload de uma imagem para a galeria de arte pública da ficha
 * (character_art, migration 0005) — distinta da mídia inspirada
 * (moodboard/referências, privada em espírito de "material de
 * trabalho") e do retrato (imagem única, substituível). A galeria de
 * arte é visível a todos os autenticados (secção 7 da spec), por isso
 * aparece em /fichas/[id], não só em /jogar.
 *
 * Reaproveita o bucket 'character-art' já existente, numa subpasta
 * "galeria/" para não colidir com o retrato nem com a mídia inspirada —
 * a policy de storage já em vigor cobre qualquer subpasta dentro de
 * {owner_id}/{character_id}/..., por isso não precisa de policy nova.
 */
export async function adicionarArte(
  characterId: string,
  formData: FormData
): Promise<ActionResult> {
  const current = await getCurrentUser();
  if (!current) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const file = formData.get("imagem");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Escolhe uma imagem." };
  }
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return { error: "Formato não suportado. Usa PNG, JPEG ou WebP." };
  }
  if (file.size > TAMANHO_MAXIMO_BYTES) {
    return { error: "A imagem tem de ter menos de 5MB." };
  }

  const legenda = String(formData.get("legenda") ?? "").trim() || null;

  const supabase = await createClient();

  const { data: character, error: fetchError } = await supabase
    .from("characters")
    .select("id, owner_id")
    .eq("id", characterId)
    .maybeSingle();

  if (fetchError || !character) {
    return { error: "Não tens permissão para editar esta ficha." };
  }

  const isDono = character.owner_id === current.user.id;
  const isCriador = current.profile.role === "criador";
  if (!isDono && !isCriador) {
    return { error: "Não tens permissão para editar esta ficha." };
  }

  const extensao = file.name.split(".").pop() || "png";
  const path = `${character.owner_id}/${characterId}/galeria/${Date.now()}.${extensao}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file);

  if (uploadError) {
    return { error: "Não foi possível enviar a imagem: " + uploadError.message };
  }

  const { data, error } = await supabase
    .from("character_art")
    .insert({
      character_id: characterId,
      uploaded_by: current.user.id,
      storage_path: path,
      legenda,
    })
    .select("*")
    .maybeSingle<ArteItem>();

  if (error) {
    return { error: "Imagem enviada, mas não foi possível associá-la à ficha." };
  }
  if (!data) {
    return { error: "Não tens permissão para editar esta ficha." };
  }

  revalidatePath(`/fichas/${characterId}`);
  revalidatePath(`/fichas/${characterId}/jogar`);
  revalidatePath("/fichas");
  return { success: true, item: data };
}

export async function removerArte(
  itemId: string,
  characterId: string
): Promise<{ error?: string }> {
  const current = await getCurrentUser();
  if (!current) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("character_art")
    .delete()
    .eq("id", itemId)
    .select("storage_path")
    .maybeSingle();

  if (error) {
    return { error: "Não foi possível remover a imagem." };
  }
  if (!data) {
    return { error: "Não tens permissão para remover esta imagem." };
  }

  await supabase.storage.from(BUCKET).remove([data.storage_path]);

  revalidatePath(`/fichas/${characterId}`);
  revalidatePath(`/fichas/${characterId}/jogar`);
  revalidatePath("/fichas");
  return {};
}
