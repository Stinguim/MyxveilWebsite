"use server";

import { createClient } from "@/lib/supabase/server";
import { isCriador } from "@/lib/auth/current-user";
import { revalidatePath } from "next/cache";
import type { WikiCategoria } from "@/lib/wiki/types";

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

  const categoriaId = (formData.get("categoria_id") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim();
  const titulo = (formData.get("titulo") as string)?.trim();
  const conteudo = (formData.get("conteudo") as string) ?? "";
  const publicada = formData.get("publicada") === "on";
  const groupId = (formData.get("group_id") as string) || null;
  const ordem = Number(formData.get("ordem") ?? 0);

  if (!categoriaId || !slug || !titulo) {
    return { erro: "Categoria, slug e título são obrigatórios." };
  }

  const { data, error } = await supabase
    .from("wiki_pages")
    .insert({
      categoria_id: categoriaId,
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

  revalidatePath("/wiki");
  revalidatePath("/admin/wiki");
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

  const categoriaId = (formData.get("categoria_id") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim();
  const titulo = (formData.get("titulo") as string)?.trim();
  const conteudo = (formData.get("conteudo") as string) ?? "";
  const publicada = formData.get("publicada") === "on";
  const groupId = (formData.get("group_id") as string) || null;
  const ordem = Number(formData.get("ordem") ?? 0);

  if (!categoriaId || !slug || !titulo) {
    return { erro: "Categoria, slug e título são obrigatórios." };
  }

  const { data, error } = await supabase
    .from("wiki_pages")
    .update({
      categoria_id: categoriaId,
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

  revalidatePath("/wiki");
  revalidatePath("/admin/wiki");
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

  revalidatePath("/wiki");
  revalidatePath("/admin/wiki");
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

  revalidatePath("/wiki");
  revalidatePath("/admin/wiki");
  return {};
}

// ----------------------------------------------------------------------------
// Categorias (migration 0021 — substitui o enum fixo categoria_wiki)
// ----------------------------------------------------------------------------

type CategoriaActionResult = { erro: string } | { success: true; data: WikiCategoria };

export async function criarCategoriaWiki(
  nome: string,
  ordem: number
): Promise<CategoriaActionResult> {
  if (!(await isCriador())) {
    return { erro: "Não tens permissão para criar categorias." };
  }

  const nomeTratado = nome.trim();
  if (!nomeTratado) {
    return { erro: "A categoria precisa de um nome." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wiki_categorias")
    .insert({ nome: nomeTratado, ordem })
    .select("*")
    .maybeSingle<WikiCategoria>();

  if (error) {
    if (error.code === "23505") {
      return { erro: "Já existe uma categoria com esse nome." };
    }
    return { erro: "Não foi possível criar a categoria." };
  }
  if (!data) {
    return { erro: "Não tens permissão para criar categorias." };
  }

  revalidatePath("/wiki");
  revalidatePath("/admin/wiki");
  return { success: true, data };
}

export async function atualizarCategoriaWiki(
  id: string,
  nome: string,
  ordem: number
): Promise<CategoriaActionResult> {
  if (!(await isCriador())) {
    return { erro: "Não tens permissão para editar categorias." };
  }

  const nomeTratado = nome.trim();
  if (!nomeTratado) {
    return { erro: "A categoria precisa de um nome." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wiki_categorias")
    .update({ nome: nomeTratado, ordem })
    .eq("id", id)
    .select("*")
    .maybeSingle<WikiCategoria>();

  if (error) {
    if (error.code === "23505") {
      return { erro: "Já existe uma categoria com esse nome." };
    }
    return { erro: "Não foi possível atualizar a categoria." };
  }
  if (!data) {
    return { erro: "Não tens permissão para editar esta categoria, ou ela já não existe." };
  }

  revalidatePath("/wiki");
  revalidatePath("/admin/wiki");
  return { success: true, data };
}

export async function apagarCategoriaWiki(id: string): Promise<{ erro?: string }> {
  if (!(await isCriador())) {
    return { erro: "Não tens permissão para apagar categorias." };
  }

  const supabase = await createClient();

  // A FK wiki_pages.categoria_id é "on delete restrict" — se houver
  // páginas nesta categoria, o Postgres recusa o delete com um erro de
  // violação de chave estrangeira. Verificamos primeiro para dar uma
  // mensagem clara em vez de deixar o erro genérico do Postgres passar.
  const { count } = await supabase
    .from("wiki_pages")
    .select("id", { count: "exact", head: true })
    .eq("categoria_id", id);

  if (count && count > 0) {
    return {
      erro: `Esta categoria tem ${count} página(s). Move-as para outra categoria antes de apagar.`,
    };
  }

  const { data, error } = await supabase
    .from("wiki_categorias")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { erro: "Não foi possível apagar a categoria." };
  }
  if (!data) {
    return { erro: "Não tens permissão para apagar esta categoria, ou ela já não existe." };
  }

  revalidatePath("/wiki");
  revalidatePath("/admin/wiki");
  return {};
}
