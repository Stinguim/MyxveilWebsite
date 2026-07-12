"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { revalidatePath } from "next/cache";

const BUCKET = "character-art";
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5MB
const TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];

type ActionResult = { error: string } | { success: true; retrato_path: string };

/**
 * Upload do retrato da personagem. Reaproveita o bucket "character-art"
 * (migration 0005), na mesma convenção de path {owner_id}/{character_id}/
 * {filename} — as policies de storage já existentes (baseadas na pasta)
 * cobrem esta escrita sem precisar de nada novo.
 *
 * upsert: true porque um retrato é substituível (path fixo por ficha:
 * "retrato" + extensão), ao contrário da galeria de arte onde cada
 * upload é uma entrada nova.
 */
export async function atualizarRetrato(
  characterId: string,
  formData: FormData
): Promise<ActionResult> {
  const current = await getCurrentUser();
  if (!current) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const file = formData.get("retrato");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Escolhe uma imagem para o retrato." };
  }
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return { error: "Formato não suportado. Usa PNG, JPEG ou WebP." };
  }
  if (file.size > TAMANHO_MAXIMO_BYTES) {
    return { error: "A imagem tem de ter menos de 5MB." };
  }

  const supabase = await createClient();

  // Confirma que a ficha existe e o utilizador tem permissão de a editar
  // ANTES de gastar upload — a policy de storage usa (storage.foldername
  // (name))[1] = auth.uid()::text, por isso o path tem de começar pelo
  // owner_id real da ficha, não pelo utilizador atual (que pode ser o
  // CRIADOR a editar a ficha de outro).
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

  // Nota: se for o CRIADOR a editar a ficha de outro jogador, o path usa
  // o owner_id do DONO (não o do CRIADOR), porque é isso que a policy de
  // storage exige. O CRIADOR só consegue este upload se a policy de
  // storage também tiver a cláusula is_criador() (já tem, ver 0005).
  const extensao = file.name.split(".").pop() || "png";
  const path = `${character.owner_id}/${characterId}/retrato.${extensao}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return { error: "Não foi possível enviar a imagem: " + uploadError.message };
  }

  const { data, error } = await supabase
    .from("characters")
    .update({ retrato_path: path })
    .eq("id", characterId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "Imagem enviada, mas não foi possível associá-la à ficha." };
  }
  if (!data) {
    return { error: "Não tens permissão para editar esta ficha." };
  }

  revalidatePath(`/fichas/${characterId}`);
  revalidatePath(`/fichas/${characterId}/jogar`);
  revalidatePath("/fichas");
  return { success: true, retrato_path: path };
}

export async function removerRetrato(
  characterId: string
): Promise<{ error?: string }> {
  const current = await getCurrentUser();
  if (!current) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("characters")
    .update({ retrato_path: null })
    .eq("id", characterId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "Não foi possível remover o retrato." };
  }
  if (!data) {
    return { error: "Não tens permissão para editar esta ficha." };
  }

  // Nota: o ficheiro em si fica no bucket (órfão) — sem UI de galeria
  // ainda não há um sítio óbvio para gerir limpeza de ficheiros não
  // referenciados. Aceitável por agora (bucket já é público/gratuito
  // dentro do plano); revisitar se isto começar a pesar no Storage.
  revalidatePath(`/fichas/${characterId}`);
  revalidatePath(`/fichas/${characterId}/jogar`);
  revalidatePath("/fichas");
  return {};
}
