-- ============================================================================
-- 0006_fix_discord_username.sql
-- Correção: o Discord devolve o username em raw_user_meta_data->>'full_name',
-- não em 'user_name' (essa chave é de outros providers, ex: GitHub).
-- Corre isto se já tinhas corrido as migrations 0001-0005 antes desta
-- correção.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome_alcunha, discord_username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Corrige também os registos já criados antes desta correção, cujo
-- discord_username tenha ficado NULL apesar de terem entrado por Discord.
update public.profiles p
set discord_username = u.raw_user_meta_data ->> 'full_name'
from auth.users u
where p.id = u.id
  and p.discord_username is null
  and u.raw_user_meta_data ->> 'full_name' is not null;
