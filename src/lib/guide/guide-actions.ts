"use server";

import { createClient } from "@/lib/supabase/server";
import { isCriador } from "@/lib/auth/current-user";
import type { CategoriaGuia } from "@/lib/guide/types";

export type GuideActionResult = { erro: string } | { id: string };

// Todas as escritas confirmam isCriador() no servidor antes de tentar a
// query — mesma razão documentada em wiki/actions.ts: dá uma mensagem de
// erro explícita em vez de um "sucesso" silencioso com 0 linhas afetadas.

export async function criarPaginaGuia(formData: FormData): Promise<GuideActionResult> {
  if (!(await isCriador())) {
    return { erro: "Não tens permissão para criar páginas do guia." };
  }

  const supabase = await createClient();

  const categoria = formData.get("categoria") as CategoriaGuia;
  const slug = (formData.get("slug") as string)?.trim();
  const titulo = (formData.get("titulo") as string)?.trim();
  const conteudo = (formData.get("conteudo") as string) ?? "";
  const publicada = formData.get("publicada") === "on";
  const ordem = Number(formData.get("ordem") ?? 0);

  if (!categoria || !slug || !titulo) {
    return { erro: "Categoria, slug e título são obrigatórios." };
  }

  const { data, error } = await supabase
    .from("guide_pages")
    .insert({
      categoria,
      slug,
      titulo,
      conteudo,
      publicada,
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
    return { erro: "Não tens permissão para criar páginas do guia." };
  }

  return { id: data.id };
}

export async function atualizarPaginaGuia(
  id: string,
  formData: FormData
): Promise<GuideActionResult> {
  if (!(await isCriador())) {
    return { erro: "Não tens permissão para editar páginas do guia." };
  }

  const supabase = await createClient();

  const categoria = formData.get("categoria") as CategoriaGuia;
  const slug = (formData.get("slug") as string)?.trim();
  const titulo = (formData.get("titulo") as string)?.trim();
  const conteudo = (formData.get("conteudo") as string) ?? "";
  const publicada = formData.get("publicada") === "on";
  const ordem = Number(formData.get("ordem") ?? 0);

  if (!categoria || !slug || !titulo) {
    return { erro: "Categoria, slug e título são obrigatórios." };
  }

  const { data, error } = await supabase
    .from("guide_pages")
    .update({
      categoria,
      slug,
      titulo,
      conteudo,
      publicada,
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

export async function alternarPublicacaoGuia(
  id: string,
  publicada: boolean
): Promise<GuideActionResult> {
  if (!(await isCriador())) {
    return { erro: "Não tens permissão para publicar/despublicar páginas." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guide_pages")
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

export async function apagarPaginaGuia(id: string): Promise<{ erro?: string }> {
  if (!(await isCriador())) {
    return { erro: "Não tens permissão para apagar páginas do guia." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guide_pages")
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
