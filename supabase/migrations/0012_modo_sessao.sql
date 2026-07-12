-- ============================================================================
-- 0012_modo_sessao.sql
-- "Modo sessão": acompanhar HP e Sanidade atuais (dano/cura ao longo da
-- sessão) e recursos livres por ficha (pontos de habilidade, munição,
-- etc — nome + valor atual/máximo, criados livremente por ficha).
--
-- hp_total e sanidade continuam colunas geradas (o MÁXIMO, calculado a
-- partir de CON/INT — migration 0002). hp_atual/sanidade_atual são novas
-- colunas normais (editáveis), inicializadas ao máximo e repostas ao
-- máximo sempre que o máximo mudar (ex: subir CON a meio da campanha).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HP atual e Sanidade atual
-- ----------------------------------------------------------------------------

alter table public.characters
  add column hp_atual smallint,
  add column sanidade_atual smallint;

-- Preenche o estado atual para fichas já existentes = ao máximo de hoje.
update public.characters
set hp_atual = hp_total,
    sanidade_atual = sanidade;

alter table public.characters
  alter column hp_atual set not null,
  alter column hp_atual set default 0,
  alter column sanidade_atual set not null,
  alter column sanidade_atual set default 0;

-- Nota: sem check (hp_atual between 0 and hp_total) — Postgres não permite
-- CHECK referenciando outra coluna gerada de forma fiável em todas as
-- versões, e queremos permitir hp_atual > hp_total temporariamente (ex:
-- efeito de "HP temporário") sem partir a escrita. Validação de limites
-- fica na aplicação (Server Action), como já acontece noutros campos.

comment on column public.characters.hp_atual is
  'HP atual da sessão (dano/cura). Editável por dono ou CRIADOR. Resetado a hp_total sempre que hp_total mudar (trigger reset_recursos_ao_mudar_maximo).';
comment on column public.characters.sanidade_atual is
  'Sanidade atual da sessão. Editável por dono ou CRIADOR. Resetado a sanidade sempre que sanidade mudar (mesmo trigger).';

-- ----------------------------------------------------------------------------
-- 2. Trigger de reset ao máximo
--
-- hp_total/sanidade são "generated always as stored": dentro de um
-- trigger BEFORE INSERT/UPDATE, NEW já contém o valor recém-computado
-- dessas colunas (o Postgres calcula colunas geradas antes de correr
-- triggers BEFORE ROW), por isso dá para comparar NEW.hp_total com
-- OLD.hp_total em segurança.
-- ----------------------------------------------------------------------------

create or replace function public.reset_recursos_ao_mudar_maximo()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.hp_atual := new.hp_total;
    new.sanidade_atual := new.sanidade;
    return new;
  end if;

  -- tg_op = 'UPDATE'
  if new.hp_total is distinct from old.hp_total then
    new.hp_atual := new.hp_total;
  end if;

  if new.sanidade is distinct from old.sanidade then
    new.sanidade_atual := new.sanidade;
  end if;

  return new;
end;
$$;

comment on function public.reset_recursos_ao_mudar_maximo() is
  'Repõe hp_atual/sanidade_atual ao máximo sempre que hp_total/sanidade (colunas geradas a partir de CON/INT) mudam — ex: o jogador ajusta um atributo a meio da campanha.';

-- Corre ANTES do trigger set_characters_updated_at (ordem alfabética dos
-- nomes de trigger no Postgres, dentro do mesmo timing/evento) — não
-- interessa aqui porque não há dependência entre os dois.
create trigger reset_recursos_ao_mudar_maximo
  before insert or update on public.characters
  for each row execute function public.reset_recursos_ao_mudar_maximo();

-- ----------------------------------------------------------------------------
-- 3. Recursos livres por ficha (pontos de habilidade, munição, etc)
-- ----------------------------------------------------------------------------

create table public.character_recursos (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters (id) on delete cascade,

  nome text not null,
  valor_atual integer not null default 0,
  valor_maximo integer not null default 0,
  ordem smallint not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint character_recursos_nome_nao_vazio check (btrim(nome) <> '')
);

create index character_recursos_character_id_idx
  on public.character_recursos (character_id);

create trigger set_character_recursos_updated_at
  before update on public.character_recursos
  for each row execute function public.set_updated_at();

alter table public.character_recursos enable row level security;

-- Leitura: segue a mesma regra de visibilidade das fichas (reaproveita o
-- padrão já corrigido em 0011 para relations/art — nunca expor recursos
-- de fichas privadas de outros).
create policy "character_recursos_select"
  on public.character_recursos for select
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

-- Escrita: dono da ficha ou CRIADOR (pedido: "Dono e o CRIADOR" podem
-- alterar HP/Sanidade/recursos durante a sessão).
create policy "character_recursos_write"
  on public.character_recursos for all
  to authenticated
  using (
    public.is_criador()
    or exists (
      select 1 from public.characters c
      where c.id = character_id and c.owner_id = auth.uid()
    )
  )
  with check (
    public.is_criador()
    or exists (
      select 1 from public.characters c
      where c.id = character_id and c.owner_id = auth.uid()
    )
  );

comment on table public.character_recursos is
  'Recursos livres por ficha (pontos de habilidade, munição, etc) — nome + valor atual/máximo, criados livremente pelo dono ou CRIADOR. Parte do "modo sessão".';
