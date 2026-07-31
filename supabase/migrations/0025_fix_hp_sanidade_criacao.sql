-- ============================================================================
-- 0025_fix_hp_sanidade_criacao.sql
-- BUG: HP e Sanidade atuais nascem a 0 na criação de uma ficha nova.
--
-- Causa: em produção o trigger `reset_recursos_ao_mudar_maximo` pode
-- ainda estar na versão da migration 0012 (ou uma mistura entre 0012 e
-- 0014), que faz `new.hp_atual := new.hp_total` dentro de um trigger
-- BEFORE INSERT. `hp_total`/`sanidade` são colunas "generated always as
-- stored", e o Postgres só as materializa DEPOIS de todos os triggers
-- BEFORE ROW terminarem — ou seja, `new.hp_total`/`new.sanidade` estão
-- sempre `null` nesse ponto do INSERT. O resultado gravado em
-- `hp_atual`/`sanidade_atual` fica então dependente de como cada versão
-- da função tratava esse `null` (0012 grava null direto; se a coluna já
-- não tivesse NOT NULL nessa altura, ou se o valor foi depois lido/
-- exibido como 0 por um `?? 0` na aplicação, aparece como "0" ao
-- utilizador).
--
-- Esta migration:
--   1. Reaplica a função corrigida (idempotente — segura de correr
--      mesmo que 0015 já tenha corrido), para garantir que a versão em
--      produção nunca lê uma coluna gerada dentro do trigger BEFORE.
--   2. Corrige quaisquer fichas com hp_atual/sanidade_atual dessincronizados
--      do valor correto (0, null, ou qualquer valor que não bata com a
--      fórmula), sem tocar em fichas onde o jogador já tenha tomado dano
--      real (só corrige quando hp_atual/sanidade_atual == hp_total/sanidade
--      "errado" que resultaria da fórmula com null, ou está claramente
--      fora de qualquer valor válido: null ou 0 com atributos que não
--      dão 0).
-- ============================================================================

create or replace function public.reset_recursos_ao_mudar_maximo()
returns trigger
language plpgsql
as $$
declare
  novo_hp_total smallint := new.hp_dado_1d6 + 8 + new.atributo_con;
  novo_sanidade smallint := 10 - new.atributo_int;
  antigo_hp_total smallint;
  antigo_sanidade smallint;
begin
  if tg_op = 'INSERT' then
    -- Nunca ler new.hp_total/new.sanidade aqui — são colunas geradas,
    -- ainda não materializadas neste ponto do trigger BEFORE INSERT.
    new.hp_atual := coalesce(new.hp_atual, novo_hp_total);
    new.sanidade_atual := coalesce(new.sanidade_atual, novo_sanidade);
    return new;
  end if;

  -- tg_op = 'UPDATE': repõe ao máximo só quando o máximo de facto muda
  -- (ex: o jogador ajustou CON ou INT).
  antigo_hp_total := old.hp_dado_1d6 + 8 + old.atributo_con;
  antigo_sanidade := 10 - old.atributo_int;

  if novo_hp_total is distinct from antigo_hp_total then
    new.hp_atual := novo_hp_total;
  elsif new.hp_atual is null then
    new.hp_atual := old.hp_atual;
  end if;

  if novo_sanidade is distinct from antigo_sanidade then
    new.sanidade_atual := novo_sanidade;
  elsif new.sanidade_atual is null then
    new.sanidade_atual := old.sanidade_atual;
  end if;

  return new;
end;
$$;

comment on function public.reset_recursos_ao_mudar_maximo() is
  'Repõe hp_atual/sanidade_atual ao máximo quando CON/INT mudam. Calcula os valores manualmente a partir da fórmula (hp_dado_1d6+8+CON, 10-INT) em vez de ler NEW.hp_total/NEW.sanidade, que estão sempre null dentro de um trigger BEFORE por serem colunas geradas. Reaplicado em 0025 para garantir que esta é a versão ativa em produção.';

-- Garante que o trigger existe e usa esta função (recria se por algum
-- motivo tiver sido dropado ou estiver a apontar para outra função).
drop trigger if exists reset_recursos_ao_mudar_maximo on public.characters;
create trigger reset_recursos_ao_mudar_maximo
  before insert or update on public.characters
  for each row execute function public.reset_recursos_ao_mudar_maximo();

-- ----------------------------------------------------------------------------
-- Corrige fichas já criadas com hp_atual/sanidade_atual errados.
--
-- Só corrige quando o valor atual está claramente errado (null, ou 0
-- quando a fórmula correta não dá 0) — nunca mexe numa ficha onde
-- hp_atual/sanidade_atual já se afastou do máximo por jogo real (dano
-- sofrido, etc), porque nesses casos o valor abaixo do máximo é legítimo
-- e não deve ser "corrigido" de volta ao máximo.
-- ----------------------------------------------------------------------------

update public.characters
set hp_atual = hp_total
where hp_atual is null
   or (hp_atual = 0 and hp_total <> 0);

update public.characters
set sanidade_atual = sanidade
where sanidade_atual is null
   or (sanidade_atual = 0 and sanidade <> 0);
