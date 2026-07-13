"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { revalidatePath } from "next/cache";
import type { MidiaInspirada } from "@/lib/characters/types";

const BUCKET = "character-art";
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5MB
const TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];

type ActionResult =
  | { error: string }
  | { success: true; item: MidiaInspirada };

/**
 * Upload de uma imagem para a mini-galeria de "mídia inspirada"
 * (moodboard/referências) de uma ficha. Reaproveita o bucket
 * 'character-art' (migration 0005) já existente, numa subpasta própria
 * "inspiracao/" para não colidir com o retrato nem com character_art —
 * as policies de storage já em vigor (baseadas em
 * (storage.foldername(name))[1] = owner_id) cobrem qualquer subpasta
 * dentro de {owner_id}/{character_id}/..., por isso não precisa de
 * policy nova.
 *
 * Ao contrário do retrato (upsert num path fixo), aqui cada upload é uma
 * entrada nova na galeria — por isso o nome do ficheiro inclui um
 * timestamp para nunca colidir.
 */
export async function adicionarMidiaInspirada(
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

  // Confirma que a ficha existe e que o utilizador tem permissão de a
  // editar ANTES de gastar upload — o path tem de começar pelo owner_id
  // real da ficha (não o do utilizador atual, que pode ser o CRIADOR a
  // editar a ficha de outro jogador), porque é isso que a policy de
  // storage exige.
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
  const path = `${character.owner_id}/${characterId}/inspiracao/${Date.now()}.${extensao}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file);

  if (uploadError) {
    return { error: "Não foi possível enviar a imagem: " + uploadError.message };
  }

  const { data, error } = await supabase
    .from("character_midia_inspirada")
    .insert({
      character_id: characterId,
      uploaded_by: current.user.id,
      storage_path: path,
      legenda,
    })
    .select("*")
    .maybeSingle<MidiaInspirada>();

  if (error) {
    return { error: "Imagem enviada, mas não foi possível associá-la à ficha." };
  }
  if (!data) {
    return { error: "Não tens permissão para editar esta ficha." };
  }

  revalidatePath(`/fichas/${characterId}`);
  revalidatePath(`/fichas/${characterId}/jogar`);
  return { success: true, item: data };
}

export async function removerMidiaInspirada(
  itemId: string,
  characterId: string
): Promise<{ error?: string }> {
  const current = await getCurrentUser();
  if (!current) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const supabase = await createClient();

  // Apaga primeiro o registo (a RLS garante permissão); o ficheiro em si
  // no bucket fica órfão se a remoção da linha for bem-sucedida — mesma
  // limitação já documentada para o retrato (sem UI de limpeza ainda).
  const { data, error } = await supabase
    .from("character_midia_inspirada")
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
  return {};
}
