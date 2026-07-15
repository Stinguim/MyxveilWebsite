export type Genero = "homem" | "mulher" | "nao_binario" | "outro";
export type Especie = "humano" | "furry" | "monstro" | "outro";
export type Origem = "cidade" | "vila" | "campo" | "nenhum_especifico" | "outro";

export type Classe =
  | "tank"
  | "dps_subdps"
  | "suporte"
  | "investigador"
  | "explorador"
  | "social"
  | "utilidade";

export type ElementoParanormal =
  | "magia_energia_paranormal"
  | "tecnologia_paranormal"
  | "tempo_paranormal"
  | "quebra_da_realidade"
  | "fe_paranormal"
  | "onirismo"
  | "tinta_paranormal"
  | "cosmico"
  | "void"
  | "nao_sei_deixar_historia_decidir"
  | "nenhum"
  | "outro";

export type EstadoFicha = "rascunho" | "submetida" | "aprovada" | "arquivada";
export type VisibilidadeFicha = "publica" | "privada";

/** Grupo/facção, carregado dinamicamente de public.groups (mapa de relações). */
export type Group = {
  id: string;
  nome: string;
  descricao: string | null;
  created_at: string;
  updated_at: string;
};

export type Character = {
  id: string;
  owner_id: string;
  retrato_path: string | null;

  nome: string;
  idade: number | null;
  altura: string | null;
  genero: Genero | null;
  genero_outro: string | null;
  especie: Especie | null;
  especie_outro: string | null;
  origem: Origem | null;
  origem_outro: string | null;
  aparencia: string | null;

  rotina_diaria: string | null;
  o_que_o_deixa_feliz: string | null;
  como_se_move: string | null;
  maior_desejo_objetivo: string | null;
  maior_medo_inseguranca: string | null;
  memoria_recorrente: string | null;
  talento_mundano: string | null;
  comportamento_sob_pressao: string | null;
  primeira_interacao_paranormal: string | null;
  /** Grupo/facção escolhido, referência dinâmica a public.groups. null = sem grupo, ou pedido pendente em grupo_pedido_outro. */
  group_id: string | null;
  /** Nome de um grupo novo pedido pelo jogador ("Outro"); só vira group_id real quando o CRIADOR aprova a ficha. */
  grupo_pedido_outro: string | null;
  lore_adicional: string | null;
  midia_inspirada_texto: string | null;

  atributo_for: number;
  atributo_int: number;
  atributo_des: number;
  atributo_car: number;
  atributo_con: number;
  atributo_sp: number;

  classe_principal: Classe | null;
  classe_principal_nivel: number | null;
  classe_secundaria: Classe | null;
  classe_secundaria_nivel: number | null;

  hp_dado_1d6: number;
  hp_total: number;
  hp_atual: number;
  sanidade: number;
  sanidade_atual: number;
  movimento: number;

  arma: string | null;
  elemento_paranormal: ElementoParanormal | null;
  elemento_paranormal_outro: string | null;
  habilidade_1: string | null;
  habilidade_2: string | null;

  campanha: string | null;
  estado: EstadoFicha;
  visibilidade: VisibilidadeFicha;

  created_at: string;
  updated_at: string;
};

export type CharacterWithOwner = Character & {
  owner_nome_alcunha: string | null;
  owner_discord_username: string | null;
};

/**
 * Character com o nome do grupo já resolvido (junta a groups.nome via
 * group_id) — usado onde é preciso mostrar o nome do grupo sem fazer um
 * join manual extra na página (ex: FichaPreview, ficha jogável).
 */
export type CharacterComGrupo = Character & {
  grupo_nome: string | null;
};

/** Item da mini-galeria de "mídia inspirada" (character_midia_inspirada). */
export type MidiaInspirada = {
  id: string;
  character_id: string;
  uploaded_by: string;
  storage_path: string;
  legenda: string | null;
  ordem: number;
  created_at: string;
};

/**
 * Total de pontos de atributo sugerido por nível de domínio (o mais alto
 * entre classe principal e secundária). A spec só define o valor de
 * nível 1 (secção 4.4); os restantes são uma progressão de +3 por nível
 * acordada com o CRIADOR, não uma regra oficial do playerbook.
 */
export const TOTAL_PONTOS_POR_NIVEL: Record<number, number> = {
  1: 9,
  2: 12,
  3: 15,
  4: 18,
  5: 21,
};

/** Mantido para compatibilidade, total de pontos a nível 1. */
export const TOTAL_PONTOS_ATRIBUTOS_NIVEL_1 = TOTAL_PONTOS_POR_NIVEL[1];

/** Nível de domínio mais alto entre classe principal e secundária (default 1). */
export function nivelDominioMaisAlto(character: {
  classe_principal_nivel: number | null;
  classe_secundaria_nivel: number | null;
}): number {
  return Math.max(
    character.classe_principal_nivel ?? 1,
    character.classe_secundaria_nivel ?? 1,
    1
  );
}

export const ATRIBUTOS_KEYS = [
  "atributo_for",
  "atributo_int",
  "atributo_des",
  "atributo_car",
  "atributo_con",
  "atributo_sp",
] as const;

export const GENERO_LABELS: Record<Genero, string> = {
  homem: "Homem",
  mulher: "Mulher",
  nao_binario: "Não-binário",
  outro: "Outro",
};

export const ESPECIE_LABELS: Record<Especie, string> = {
  humano: "Humano",
  furry: "Furry",
  monstro: "Monstro",
  outro: "Outro",
};

export const ORIGEM_LABELS: Record<Origem, string> = {
  cidade: "Cidade",
  vila: "Vila",
  campo: "Campo",
  nenhum_especifico: "Nenhum lugar específico",
  outro: "Outro",
};

export const CLASSE_LABELS: Record<Classe, string> = {
  tank: "Tank",
  dps_subdps: "DPS/SubDPS",
  suporte: "Suporte",
  investigador: "Investigador",
  explorador: "Explorador",
  social: "Social",
  utilidade: "Utilidade",
};

export const ELEMENTO_PARANORMAL_LABELS: Record<ElementoParanormal, string> = {
  magia_energia_paranormal: "Magia/Energia Paranormal",
  tecnologia_paranormal: "Tecnologia Paranormal",
  tempo_paranormal: "Tempo Paranormal",
  quebra_da_realidade: "Quebra da Realidade",
  fe_paranormal: "Fé Paranormal",
  onirismo: "Onirismo",
  tinta_paranormal: "Tinta Paranormal",
  cosmico: "Cósmico",
  void: "Void",
  nao_sei_deixar_historia_decidir: "Não sei / Deixar a história decidir",
  nenhum: "Nenhum",
  outro: "Outro",
};

export const ESTADO_LABELS: Record<EstadoFicha, string> = {
  rascunho: "Rascunho",
  submetida: "Submetida",
  aprovada: "Aprovada",
  arquivada: "Arquivada",
};

export const NIVEL_DOMINIO_LABELS: Record<number, string> = {
  1: "1: Iniciante",
  2: "2: Adepto",
  3: "3: Especialista",
  4: "4: Ascensão",
  5: "5: Divindade",
};
