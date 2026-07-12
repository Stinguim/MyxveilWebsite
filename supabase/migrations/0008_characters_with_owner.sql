-- ============================================================================
-- 0008_characters_with_owner.sql
-- View de conveniência que junta uma ficha ao nome/alcunha do seu dono,
-- para a UI poder mostrar "criado por X" sem um join manual em cada query.
--
-- security_invoker = true é essencial: sem isto, a view corre com os
-- privilégios de quem a criou (bypassando RLS de characters). Com
-- security_invoker, a view respeita a RLS de characters como se a query
-- fosse feita diretamente à tabela.
-- ============================================================================

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
  'characters + nome/alcunha do dono. security_invoker garante que a RLS de characters continua a aplicar-se.';

-- Nota de plataforma: projetos Supabase criados a partir de finais de
-- maio de 2026 já não expõem automaticamente tabelas/views novas à Data
-- API (a que o supabase-js usa) — é preciso um GRANT explícito. Se esta
-- view não aparecer nas queries do site, corre isto:
grant select on public.characters_with_owner to authenticated;
