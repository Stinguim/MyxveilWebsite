export type CategoriaGuia =
  | "criacao_de_personagens"
  | "dados_e_como_os_usar"
  | "combate"
  | "outro";

export const CATEGORIAS_GUIA: [CategoriaGuia, string][] = [
  ["criacao_de_personagens", "Criação de Personagens"],
  ["dados_e_como_os_usar", "Dados e como os Usar"],
  ["combate", "Combate"],
  ["outro", "Outro"],
];

export const CATEGORIA_GUIA_LABEL: Record<CategoriaGuia, string> = Object.fromEntries(
  CATEGORIAS_GUIA
) as Record<CategoriaGuia, string>;

// Ordem de apresentação das categorias na sidebar do guia, com "Outro"
// sempre por último — mesmo critério usado na wiki.
export const ORDEM_CATEGORIAS_GUIA: CategoriaGuia[] = CATEGORIAS_GUIA.map(
  ([valor]) => valor
);

export type GuidePage = {
  id: string;
  categoria: CategoriaGuia;
  slug: string;
  titulo: string;
  conteudo: string;
  publicada: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
};

// Usado nos selects de formulário (criar/editar página em /admin/guia).
export function gerarSlugGuia(titulo: string): string {
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
