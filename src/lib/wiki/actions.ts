"use server";

import { createClient } from "@/lib/supabase/server";
import { isCriador } from "@/lib/auth/current-user";
import type { CategoriaWiki } from "@/lib/wiki/types";

export type WikiActionResult = { erro: string } | { id: string };

// Todas as escritas confirmam isCriador() no servidor antes de tentar a
// query. Isto é redundante com a RLS ("wiki_pages_write_criador_only"),
// mas dá uma mensagem de erro explícita em vez de um "sucesso" silencioso
// com 0 linhas afetadas — o mesmo problema já identificado nas fichas.

export async function criarPaginaWiki(formData: FormData): Promise<WikiActionResult> {
  if (!(await isCriador())) {
    return { erro: "Não tens permissão para criar páginas da wiki." };
  }

  const supabase = await createClient();

  const categoria = formData.get("categoria") as CategoriaWiki;
  const slug = (formData.get("slug") as string)?.trim();
  const titulo = (formData.get("titulo") as string)?.trim();
  const conteudo = (formData.get("conteudo") as string) ?? "";
  const publicada = formData.get("publicada") === "on";
  const groupId = (formData.get("group_id") as string) || null;
  const ordem = Number(formData.get("ordem") ?? 0);

  if (!categoria || !slug || !titulo) {
    return { erro: "Categoria, slug e título são obrigatórios." };
  }

  const { data, error } = await supabase
    .from("wiki_pages")
    .insert({
      categoria,
      slug,
      titulo,
      conteudo,
      publicada,
      group_id: groupId,
      ordem,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { erro: "Já existe uma página com esse slug." };
    }
    return { erro: "Erro ao criar a página: " + error.message };
  }
  if (!data) {
    return { erro: "Não tens permissão para criar páginas da wiki." };
  }

  return { id: data.id };
}

export async function atualizarPaginaWiki(
  id: string,
  formData: FormData
): Promise<WikiActionResult> {
  if (!(await isCriador())) {
    return { erro: "Não tens permissão para editar páginas da wiki." };
  }

  const supabase = await createClient();

  const categoria = formData.get("categoria") as CategoriaWiki;
  const slug = (formData.get("slug") as string)?.trim();
  const titulo = (formData.get("titulo") as string)?.trim();
  const conteudo = (formData.get("conteudo") as string) ?? "";
  const publicada = formData.get("publicada") === "on";
  const groupId = (formData.get("group_id") as string) || null;
  const ordem = Number(formData.get("ordem") ?? 0);

  if (!categoria || !slug || !titulo) {
    return { erro: "Categoria, slug e título são obrigatórios." };
  }

  const { data, error } = await supabase
    .from("wiki_pages")
    .update({
      categoria,
      slug,
      titulo,
      conteudo,
      publicada,
      group_id: groupId,
      ordem,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { erro: "Já existe uma página com esse slug." };
    }
    return { erro: "Erro ao atualizar a página: " + error.message };
  }
  if (!data) {
    return { erro: "Não tens permissão para editar esta página, ou ela já não existe." };
  }

  return { id: data.id };
}

export async function alternarPublicacaoWiki(
  id: string,
  publicada: boolean
): Promise<WikiActionResult> {
  if (!(await isCriador())) {
    return { erro: "Não tens permissão para publicar/despublicar páginas." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("wiki_pages")
    .update({ publicada })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { erro: "Erro ao atualizar a página: " + error.message };
  }
  if (!data) {
    return { erro: "Não tens permissão para editar esta página." };
  }

  return { id: data.id };
}

export async function apagarPaginaWiki(id: string): Promise<{ erro?: string }> {
  if (!(await isCriador())) {
    return { erro: "Não tens permissão para apagar páginas da wiki." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("wiki_pages")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { erro: "Erro ao apagar a página: " + error.message };
  }
  if (!data) {
    return { erro: "Não tens permissão para apagar esta página, ou ela já não existe." };
  }

  return {};
}
