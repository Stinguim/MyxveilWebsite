-- ============================================================================
-- 0011_fix_private_character_leaks.sql
-- FUGA DE DADOS: com a introdução de 'visibilidade' (migration 0007), uma
-- ficha privada deixa de aparecer em characters_select para quem não é
-- dono/CRIADOR — mas character_relations e character_art continuavam a
-- expor QUALQUER relação/arte ligada a essa ficha a todos os autenticados,
-- revelando indiretamente a sua existência (ex: "Fulano é inimigo de
-- <nome de uma ficha que devias não conseguir ver>").
--
-- Fix: a leitura de character_relations e character_art passa a exigir
-- que a(s) ficha(s) envolvidas sejam efetivamente visíveis ao utilizador
-- atual (reaproveitando a mesma regra de characters_select).
-- ============================================================================

drop policy if exists "character_relations_select_authenticated" on public.character_relations;

create policy "character_relations_select"
  on public.character_relations for select
  to authenticated
  using (
    public.is_criador()
    or (
      exists (
        select 1 from public.characters c
        where c.id = character_a_id
          and (
            (c.visibilidade = 'publica' and c.estado = 'aprovada')
            or c.owner_id = auth.uid()
          )
      )
      and (
        group_b_id is not null
        or exists (
          select 1 from public.characters c
          where c.id = character_b_id
            and (
              (c.visibilidade = 'publica' and c.estado = 'aprovada')
              or c.owner_id = auth.uid()
            )
        )
      )
    )
  );

comment on policy "character_relations_select" on public.character_relations is
  'Só mostra a relação se AMBOS os lados (quando ambos são characters) forem visíveis ao utilizador atual, evitando revelar a existência de fichas privadas de outros.';

-- Mesma lógica para a galeria de arte.
drop policy if exists "character_art_select_authenticated" on public.character_art;

create policy "character_art_select"
  on public.character_art for select
  to authenticated
  using (
    public.is_criador()
    or exists (
      select 1 from public.characters c
      where c.id = character_id
        and (
          (c.visibilidade = 'publica' and c.estado = 'aprovada')
          or c.owner_id = auth.uid()
        )
    )
  );

comment on policy "character_art_select" on public.character_art is
  'Só mostra arte de fichas visíveis ao utilizador atual (públicas+aprovadas, ou próprias, ou se for CRIADOR).';

-- ----------------------------------------------------------------------------
-- Nota sobre o bucket de Storage 'character-art': continua marcado como
-- public = true, o que significa que qualquer pessoa com o URL direto do
-- ficheiro consegue vê-lo, mesmo sem sessão — buckets públicos do
-- Supabase Storage servem ficheiros sem verificar RLS/autenticação.
-- Isto é aceitável para arte de fichas públicas, mas contradiz a intenção
-- de 'privada' para as restantes.
--
-- Se vieres a construir upload de arte para fichas privadas, muda o
-- bucket para privado e serve as imagens via URLs assinados
-- (supabase.storage.from('character-art').createSignedUrl(...)), que
-- respeitam RLS/expiram. Não há UI de upload ainda, por isso isto fica
-- só documentado por agora.
-- ============================================================================
