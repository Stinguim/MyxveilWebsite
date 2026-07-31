-- ============================================================================
-- 0023_cor_relacao_outro.sql
-- Permite ao CRIADOR escolher uma cor própria para cada relação do tipo
-- "outro" no mapa (character_relations.tipo = 'outro'), em vez de todas
-- partilharem a mesma cor fixa (TIPO_RELACAO_COR.outro no código). Os
-- outros tipos (aliado, inimigo, etc.) continuam com cor fixa por tipo,
-- por decisão do CRIADOR — só "outro" ganha cor por relação.
-- ============================================================================

alter table public.character_relations
  add column cor text;

-- Validação simples de formato hex (#RRGGBB) — o valor vem de um
-- <input type="color">, que já garante este formato no browser, mas a
-- constraint evita dados inválidos entrarem por outra via (ex: API
-- direta). NULL continua permitido (relações que não sejam "outro", ou
-- um "outro" sem cor escolhida, caem no fallback de cor fixa no código).
alter table public.character_relations
  add constraint character_relations_cor_hex_format
    check (cor is null or cor ~ '^#[0-9a-fA-F]{6}$');

comment on column public.character_relations.cor is
  'Cor customizada (hex #RRGGBB) para a aresta no mapa, só usada quando tipo = ''outro''. NULL = usa a cor fixa por tipo (TIPO_RELACAO_COR no código).';
