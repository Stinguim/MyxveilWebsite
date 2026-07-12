-- ============================================================================
-- 0007_character_visibility.sql
-- Visibilidade pública/privada da ficha (independente do 'estado' —
-- rascunho/submetida/aprovada/arquivada continua a controlar o fluxo de
-- aprovação; 'visibilidade' controla quem pode ver a ficha).
--
-- Regra: uma ficha só é visível a outros jogadores quando é 'publica' E
-- está 'aprovada'. Fichas 'privada' só são visíveis ao dono e ao CRIADOR,
-- seja qual for o estado. O CRIADOR vê sempre tudo.
-- ============================================================================

create type public.visibilidade_ficha as enum ('publica', 'privada');

alter table public.characters
  add column visibilidade public.visibilidade_ficha not null default 'publica';

comment on column public.characters.visibilidade is
  'Controlado pelo dono da ficha. "privada" esconde a ficha de todos exceto o dono e o CRIADOR, independentemente do estado.';

-- Substitui a política de leitura anterior (que só olhava para 'estado')
-- por uma que também respeita 'visibilidade'.
drop policy if exists "characters_select" on public.characters;

create policy "characters_select"
  on public.characters for select
  to authenticated
  using (
    (visibilidade = 'publica' and estado = 'aprovada')
    or owner_id = auth.uid()
    or public.is_criador()
  );
