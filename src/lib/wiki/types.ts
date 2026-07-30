// Categoria deixou de ser um enum fixo (migration 0021) — agora é uma
// referência dinâmica a wiki_categorias, gerida pelo CRIADOR em
// /admin/wiki/categorias. Mesmo padrão já usado para Group em
// lib/relations/types.ts.

export type WikiCategoria = {
  id: string;
  nome: string;
  ordem: number;
  created_at: string;
  updated_at: string;
};

export type WikiPage = {
  id: string;
  categoria_id: string;
  slug: string;
  titulo: string;
  conteudo: string;
  publicada: boolean;
  group_id: string | null;
  ordem: number;
  created_at: string;
  updated_at: string;
};

// Usado nos selects de formulário (criar/editar página em /admin/wiki).
export function gerarSlug(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
