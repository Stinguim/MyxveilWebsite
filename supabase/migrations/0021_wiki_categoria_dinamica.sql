-- ============================================================================
-- 0021_wiki_categoria_dinamica.sql
-- Substitui o campo 'categoria' da wiki (enum fixo: historia_do_mundo,
-- storyline_principal, grupos_faccoes, designacoes_paranormal,
-- regras_da_mesa, outro) por uma referência dinâmica a uma tabela nova
-- 'wiki_categorias', gerida pelo CRIADOR. Mesmo padrão já usado em
-- 0019_grupo_dinamico.sql para characters.grupo -> characters.group_id.
--
-- Motivo: o CRIADOR quer poder criar categorias com nomes próprios em
-- vez de despejar tudo em "Outro" quando o conteúdo não encaixa nas
-- categorias fixas da spec original.
--
-- Fluxo novo:
-- - categoria_id (FK para wiki_categorias) = categoria escolhida de uma
--   lista dinâmica, gerida em /admin/wiki/categorias.
-- - Sem noção de "outro" pendente aqui (ao contrário do grupo_pedido em
--   0019) — só o CRIADOR escreve na wiki, por isso pode criar a
--   categoria nova diretamente, sem fluxo de aprovação.
-- ============================================================================

-- 1. Tabela de categorias, com ordem própria (a sidebar já ordena por
--    "ordem" dentro de cada categoria; agora as categorias em si também
--    precisam de uma ordem explícita, já que deixam de vir de um enum
--    com ordem implícita no CREATE TYPE).
create table public.wiki_categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ordem smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_wiki_categorias_updated_at
  before update on public.wiki_categorias
  for each row execute function public.set_updated_at();

alter table public.wiki_categorias enable row level security;

-- Leitura: todos os autenticados (precisam de ver os nomes das
-- categorias para navegar na wiki). Escrita: só o CRIADOR.
create policy "wiki_categorias_select"
  on public.wiki_categorias for select
  to authenticated
  using (true);

create policy "wiki_categorias_write_criador_only"
  on public.wiki_categorias for all
  to authenticated
  using (public.is_criador())
  with check (public.is_criador());

grant select on public.wiki_categorias to authenticated;
grant insert, update, delete on public.wiki_categorias to authenticated;

-- 2. Popula wiki_categorias com as categorias fixas existentes, na
--    mesma ordem em que já apareciam na sidebar (ORDEM_CATEGORIAS em
--    lib/wiki/types.ts), para a transição ser invisível para quem já
--    usa o site.
insert into public.wiki_categorias (nome, ordem) values
  ('História do Mundo', 0),
  ('Storyline Principal', 1),
  ('Grupos e Facções', 2),
  ('Designações do Paranormal', 3),
  ('Regras da Mesa', 4),
  ('Outro', 5);

-- 3. Nova coluna em wiki_pages, referência a wiki_categorias.
--    on delete restrict: apagar uma categoria com páginas lá dentro
--    apagaria a categoria de páginas existentes silenciosamente; melhor
--    obrigar o CRIADOR a mover as páginas primeiro (a UI de gestão de
--    categorias deve impedir apagar categorias com páginas).
alter table public.wiki_pages
  add column categoria_id uuid references public.wiki_categorias (id) on delete restrict;

-- 4. Migra os dados: liga cada página à linha de wiki_categorias que
--    corresponde ao valor antigo do enum.
update public.wiki_pages wp
set categoria_id = wc.id
from public.wiki_categorias wc
where wc.nome = case wp.categoria
  when 'historia_do_mundo' then 'História do Mundo'
  when 'storyline_principal' then 'Storyline Principal'
  when 'grupos_faccoes' then 'Grupos e Facções'
  when 'designacoes_paranormal' then 'Designações do Paranormal'
  when 'regras_da_mesa' then 'Regras da Mesa'
  when 'outro' then 'Outro'
end;

-- 5. categoria_id passa a obrigatório, agora que todas as linhas já
--    têm valor.
alter table public.wiki_pages
  alter column categoria_id set not null;

-- 6. Remove a coluna antiga (enum) e o tipo, já sem uso.
alter table public.wiki_pages
  drop column categoria;

drop type public.categoria_wiki;

comment on column public.wiki_pages.categoria_id is
  'Categoria da página, referência dinâmica a public.wiki_categorias (gerida em /admin/wiki/categorias). Substitui o antigo enum categoria_wiki.';
