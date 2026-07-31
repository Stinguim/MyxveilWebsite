export type TipoRelacao =
  | "aliado"
  | "inimigo"
  | "familia"
  | "romance"
  | "desconhece_se"
  | "rival"
  | "outro";

export const TIPO_RELACAO_OPCOES: [TipoRelacao, string][] = [
  ["aliado", "Aliado"],
  ["inimigo", "Inimigo"],
  ["familia", "Família"],
  ["romance", "Romance"],
  ["desconhece_se", "Desconhece-se"],
  ["rival", "Rival"],
  ["outro", "Outro"],
];

export const TIPO_RELACAO_LABEL: Record<TipoRelacao, string> = Object.fromEntries(
  TIPO_RELACAO_OPCOES
) as Record<TipoRelacao, string>;

// Cor da aresta no grafo, por tipo de relação — só para leitura mais
// rápida do mapa (aliado=verde, inimigo/rival=vermelho/laranja, etc).
// Usada como fallback quando a relação não tem cor própria (ver
// corDaRelacao) — o que é sempre o caso, exceto para "outro" com uma
// cor escolhida explicitamente (migration 0023).
export const TIPO_RELACAO_COR: Record<TipoRelacao, string> = {
  aliado: "#4ade80",
  inimigo: "#f87171",
  familia: "#60a5fa",
  romance: "#f472b6",
  desconhece_se: "#a3a3a3",
  rival: "#fb923c",
  outro: "#c084fc",
};

export type Group = {
  id: string;
  nome: string;
  descricao: string | null;
  created_at: string;
  updated_at: string;
};

export type CharacterRelation = {
  id: string;
  character_a_id: string;
  character_b_id: string | null;
  group_b_id: string | null;
  tipo: TipoRelacao;
  tipo_outro: string | null;
  /** Cor customizada (hex #RRGGBB), só usada quando tipo = "outro" (migration 0023). */
  cor: string | null;
  descricao: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

/**
 * Cor efetiva a usar para desenhar a aresta desta relação no grafo.
 * Só "outro" pode ter cor própria por relação — os restantes tipos
 * usam sempre a cor fixa de TIPO_RELACAO_COR, por decisão do CRIADOR
 * (manter a legibilidade rápida "vermelho = inimigo" em todo o mapa).
 */
export function corDaRelacao(relacao: Pick<CharacterRelation, "tipo" | "cor">): string {
  if (relacao.tipo === "outro" && relacao.cor) {
    return relacao.cor;
  }
  return TIPO_RELACAO_COR[relacao.tipo];
}

// Nó simplificado para o grafo — tanto characters como groups viram nós,
// distinguidos por `tipo`.
export type NoGrafo = {
  id: string; // "char:<uuid>" ou "grupo:<uuid>", para não colidir ids
  tipo: "personagem" | "grupo";
  refId: string; // id real na tabela characters/groups
  label: string;
};

export function idNoPersonagem(characterId: string): string {
  return `char:${characterId}`;
}

export function idNoGrupo(groupId: string): string {
  return `grupo:${groupId}`;
}
