"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isCriador } from "@/lib/auth/current-user";

const BUCKET = "character-art";
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5MB
const TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];

type ActionResult = { error: string } | { success: true; url: string };

/**
 * Upload de uma imagem para inserir no meio/fim do conteúdo de uma
 * página de wiki ou de guia (![legenda](url) — ver
 * lib/content/conteudo-com-imagens.tsx). Só o CRIADOR escreve wiki/guia,
 * por isso não há noção de "dono" aqui como há nas fichas.
 *
 * Reaproveita o bucket 'character-art' já existente (migration 0005),
 * numa subpasta própria "wiki-guia/" para não colidir com fichas. A
 * policy de storage de escrita é
 *   is_criador() OR (storage.foldername(name))[1] = auth.uid()::text
 * — como quem chama esta action é sempre o CRIADOR, a cláusula
 * is_criador() já cobre o insert independentemente do path escolhido.
 */
export async function uploadImagemConteudo(
  origem: "wiki" | "guia",
  formData: FormData
): Promise<ActionResult> {
  if (!(await isCriador())) {
    return { error: "Não tens permissão para inserir imagens aqui." };
  }

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

  const supabase = await createClient();

  const extensao = file.name.split(".").pop() || "png";
  const path = `${current.user.id}/wiki-guia/${origem}/${Date.now()}.${extensao}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file);

  if (uploadError) {
    return { error: "Não foi possível enviar a imagem: " + uploadError.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { success: true, url: data.publicUrl };
}
