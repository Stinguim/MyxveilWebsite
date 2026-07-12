import {
  ATRIBUTOS_KEYS,
  CLASSE_LABELS,
  ELEMENTO_PARANORMAL_LABELS,
  ESPECIE_LABELS,
  GENERO_LABELS,
  GRUPO_LABELS,
  NIVEL_DOMINIO_LABELS,
  ORIGEM_LABELS,
} from "@/lib/characters/types";

export const GENERO_OPCOES = Object.entries(GENERO_LABELS);
export const ESPECIE_OPCOES = Object.entries(ESPECIE_LABELS);
export const ORIGEM_OPCOES = Object.entries(ORIGEM_LABELS);
export const GRUPO_OPCOES = Object.entries(GRUPO_LABELS);
export const CLASSE_OPCOES = Object.entries(CLASSE_LABELS);
export const ELEMENTO_OPCOES = Object.entries(ELEMENTO_PARANORMAL_LABELS);
export const NIVEL_OPCOES = [1, 2, 3, 4, 5] as const;
export { ATRIBUTOS_KEYS, NIVEL_DOMINIO_LABELS };
