-- ============================================================================
-- 0017_fix_characters_with_owner_colunas_em_falta.sql
-- BUG: a view characters_with_owner (migration 0008) foi criada com
-- "select c.*, ..." ANTES de várias colunas terem sido adicionadas a
-- characters (retrato_path na 0013; altura e midia_inspirada_texto na
-- 0016). No Postgres, "c.*" numa view é expandido para a lista de
-- colunas concreta que existia no momento do CREATE VIEW — colunas
-- adicionadas à tabela depois disso NÃO aparecem automaticamente na
-- view, mesmo que a query pareça genérica. Por isso o retrato (e agora
-- também altura/mídia inspirada) nunca chegava ao card da listagem
-- /fichas, apesar de a coluna existir e estar preenchida na tabela.
--
-- Fix: recriar a view do zero, para o Postgres reexpandir "c.*" com a
-- lista de colunas atual. Isto tem de ser repetido sempre que novas
-- colunas forem adicionadas a characters, a menos que se troque para
-- listar as colunas explicitamente — mantém-se c.* por simplicidade e
-- consistência com o resto do código, mas fica a nota para o futuro.
-- ============================================================================

drop view if exists public.characters_with_owner;

create view public.characters_with_owner
  with (security_invoker = true)
  as
  select
    c.*,
    p.nome_alcunha as owner_nome_alcunha,
    p.discord_username as owner_discord_username
  from public.characters c
  join public.profiles p on p.id = c.owner_id;

comment on view public.characters_with_owner is
  'characters + nome/alcunha do dono. security_invoker garante que a RLS de characters continua a aplicar-se. IMPORTANTE: recriar esta view (drop + create) sempre que uma coluna nova for adicionada a characters, porque "c.*" fica congelado na lista de colunas do momento do CREATE VIEW.';

grant select on public.characters_with_owner to authenticated;
