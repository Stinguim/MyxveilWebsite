export type CategoriaWiki =
  | "historia_do_mundo"
  | "storyline_principal"
  | "grupos_faccoes"
  | "designacoes_paranormal"
  | "regras_da_mesa"
  | "outro";

export const CATEGORIAS_WIKI: [CategoriaWiki, string][] = [
  ["historia_do_mundo", "História do Mundo"],
  ["storyline_principal", "Storyline Principal"],
  ["grupos_faccoes", "Grupos e Facções"],
  ["designacoes_paranormal", "Designações do Paranormal"],
  ["regras_da_mesa", "Regras da Mesa"],
  ["outro", "Outro"],
];

export const CATEGORIA_LABEL: Record<CategoriaWiki, string> = Object.fromEntries(
  CATEGORIAS_WIKI
) as Record<CategoriaWiki, string>;

// Ordem de apresentação das categorias na sidebar — segue a ordem da spec
// (secção 6), com "Outro" sempre por último.
export const ORDEM_CATEGORIAS: CategoriaWiki[] = CATEGORIAS_WIKI.map(
  ([valor]) => valor
);

export type WikiPage = {
  id: string;
  categoria: CategoriaWiki;
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
