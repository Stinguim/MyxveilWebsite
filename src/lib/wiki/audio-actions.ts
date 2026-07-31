"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isCriador } from "@/lib/auth/current-user";
import { revalidatePath } from "next/cache";

const BUCKET = "character-art";
const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10MB
const TIPOS_PERMITIDOS = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"];

type ActionResult = { error: string } | { success: true; audio_path: string };

/**
 * Upload do áudio de leitura de uma página de wiki. Reaproveita o
 * bucket "character-art" (migration 0005), na mesma subpasta
 * "wiki-guia/" já usada para imagens de conteúdo (ver
 * lib/content/imagem-conteudo-actions.ts), com uma subpasta própria
 * "audio/" lá dentro para não misturar com imagens.
 *
 * upsert: true porque o áudio é substituível (path fixo por página:
 * "audio" + extensão), ao contrário de uma galeria onde cada upload é
 * uma entrada nova — só a wiki tem áudio, e só um por página.
 *
 * Só o CRIADOR escreve na wiki, por isso não há noção de "dono" aqui.
 */
export async function atualizarAudioWiki(
  paginaId: string,
  formData: FormData
): Promise<ActionResult> {
  if (!(await isCriador())) {
    return { error: "Não tens permissão para adicionar áudio à wiki." };
  }

  const current = await getCurrentUser();
  if (!current) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const file = formData.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Escolhe um ficheiro de áudio." };
  }
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return { error: "Formato não suportado. Usa MP3, WAV, OGG ou M4A." };
  }
  if (file.size > TAMANHO_MAXIMO_BYTES) {
    return { error: "O áudio tem de ter menos de 10MB." };
  }

  const supabase = await createClient();

  const extensao = file.name.split(".").pop() || "mp3";
  const path = `${current.user.id}/wiki-guia/wiki-audio/${paginaId}-${Date.now()}.${extensao}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return { error: "Não foi possível enviar o áudio: " + uploadError.message };
  }

  const { data, error } = await supabase
    .from("wiki_pages")
    .update({ audio_path: path })
    .eq("id", paginaId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "Áudio enviado, mas não foi possível associá-lo à página." };
  }
  if (!data) {
    return { error: "Não tens permissão para editar esta página." };
  }

  revalidatePath("/wiki");
  revalidatePath(`/wiki/${paginaId}`);
  revalidatePath("/admin/wiki");
  return { success: true, audio_path: path };
}

export async function removerAudioWiki(paginaId: string): Promise<{ error?: string }> {
  if (!(await isCriador())) {
    return { error: "Não tens permissão para remover áudio da wiki." };
  }

  const supabase = await createClient();

  const { data: paginaAtual } = await supabase
    .from("wiki_pages")
    .select("audio_path")
    .eq("id", paginaId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("wiki_pages")
    .update({ audio_path: null })
    .eq("id", paginaId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "Não foi possível remover o áudio." };
  }
  if (!data) {
    return { error: "Não tens permissão para editar esta página." };
  }

  if (paginaAtual?.audio_path) {
    await supabase.storage.from(BUCKET).remove([paginaAtual.audio_path]);
  }

  revalidatePath("/wiki");
  revalidatePath(`/wiki/${paginaId}`);
  revalidatePath("/admin/wiki");
  return {};
}
