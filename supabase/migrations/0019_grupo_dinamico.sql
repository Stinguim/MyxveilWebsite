-- ============================================================================
-- 0019_grupo_dinamico.sql
-- Substitui o campo 'grupo' (enum fixo: apic, pawned, culto_da_duvessa,
-- ajudantes_do_eshir, void, anormais, nenhum, outro) por uma referência
-- dinâmica à tabela 'groups' já usada pelo mapa de relações (migration
-- 0003). Isto permite ao CRIADOR gerir os grupos disponíveis num único
-- sítio (o mapa), em vez de precisar de uma migration sempre que um
-- grupo novo é criado na história.
--
-- Fluxo novo:
-- - group_id (FK para groups) = grupo escolhido de uma lista dinâmica.
-- - group_id null + grupo_pedido_outro preenchido = jogador pediu um
--   grupo que ainda não existe ("Outro"); o grupo só é criado de facto
--   quando o CRIADOR aprova a ficha (ver alteração a aprovarFicha em
--   src/lib/characters/actions.ts) — nesse momento group_id passa a
--   apontar para o grupo recém-criado e grupo_pedido_outro é limpo.
-- - Ambos null = "Nenhum" (sem grupo).
-- ============================================================================

-- 1. Nova coluna, referência a groups. on delete set null: se o CRIADOR
--    apagar um grupo do mapa, as fichas que lá pertenciam não ficam
--    numa referência pendurada — voltam a "Nenhum", sem apagar a ficha.
alter table public.characters
  add column group_id uuid references public.groups (id) on delete set null;

-- 2. Migra os dados existentes: para cada valor distinto do enum antigo
--    (exceto 'nenhum' e 'outro', que não correspondem a um grupo real),
--    garante que existe uma linha em groups com esse nome, e liga.
do $$
declare
  mapa_labels constant jsonb := '{
    "apic": "APIC",
    "pawned": "PAWNED",
    "culto_da_duvessa": "Culto da Duvessa",
    "ajudantes_do_eshir": "Ajudantes do Eshir",
    "void": "Void",
    "anormais": "Anormais"
  }'::jsonb;
  valor_enum text;
  nome_grupo text;
  grupo_id uuid;
begin
  for valor_enum, nome_grupo in
    select key, value from jsonb_each_text(mapa_labels)
  loop
    -- Só faz algo se houver pelo menos uma ficha com este valor.
    if exists (select 1 from public.characters where grupo::text = valor_enum) then
      select id into grupo_id from public.groups where nome = nome_grupo;

      if grupo_id is null then
        insert into public.groups (nome)
        values (nome_grupo)
        returning id into grupo_id;
      end if;

      update public.characters
      set group_id = grupo_id
      where grupo::text = valor_enum;
    end if;
  end loop;
end $$;

-- 3. Renomeia grupo_outro para deixar claro que agora é um PEDIDO
--    pendente (só vira grupo de facto quando o CRIADOR aprovar a
--    ficha), não mais um valor final gravado diretamente na ficha.
--    Fichas que já tinham grupo = 'outro' mantêm o texto pedido aqui;
--    group_id fica null até serem aprovadas (ver passo 4 abaixo, só
--    para as já aprovadas).
alter table public.characters
  rename column grupo_outro to grupo_pedido_outro;

comment on column public.characters.grupo_pedido_outro is
  'Nome de um grupo novo pedido pelo jogador (equivalente ao antigo "grupo = outro"). Só vira uma linha real em groups, com group_id a apontar para lá, quando o CRIADOR aprova a ficha (ver aprovarFicha).';

-- 4. Para fichas que já tinham grupo = 'outro' E já estavam aprovadas,
--    cria o grupo imediatamente (não faz sentido esperar por uma nova
--    aprovação que pode nunca vir a acontecer, para conteúdo que já
--    estava em jogo).
do $$
declare
  r record;
  grupo_id uuid;
begin
  for r in
    select id, grupo_pedido_outro
    from public.characters
    where grupo::text = 'outro'
      and estado = 'aprovada'
      and grupo_pedido_outro is not null
      and btrim(grupo_pedido_outro) <> ''
  loop
    select id into grupo_id from public.groups where nome = r.grupo_pedido_outro;

    if grupo_id is null then
      insert into public.groups (nome)
      values (r.grupo_pedido_outro)
      returning id into grupo_id;
    end if;

    update public.characters
    set group_id = grupo_id, grupo_pedido_outro = null
    where id = r.id;
  end loop;
end $$;

-- 5. Remove a coluna antiga (enum) — os dados relevantes já foram
--    migrados para group_id (passo 2) ou preservados em
--    grupo_pedido_outro (passo 3/4) para os casos "outro" ainda por
--    aprovar.
alter table public.characters
  drop column grupo;

comment on column public.characters.group_id is
  'Grupo/facção a que o personagem pertence, referência dinâmica a public.groups (gerido em /admin/mapa). NULL = sem grupo, ou pedido pendente em grupo_pedido_outro.';

-- 6. Recria characters_with_owner: "c.*" fica congelado na lista de
--    colunas do momento do CREATE VIEW (ver nota na migration 0017);
--    sem isto, group_id e grupo_pedido_outro não apareceriam na
--    listagem /fichas.
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
