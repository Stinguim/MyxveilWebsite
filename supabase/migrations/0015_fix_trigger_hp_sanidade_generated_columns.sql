-- ============================================================================
-- 0015_fix_trigger_hp_sanidade_generated_columns.sql
-- BUG DE RAIZ: hp_total/sanidade são colunas "generated always as stored".
-- O Postgres só materializa o valor de colunas geradas STORED depois de
-- todos os triggers BEFORE ROW terminarem — ou seja, dentro de um
-- trigger BEFORE INSERT/UPDATE, NEW.hp_total e NEW.sanidade estão
-- SEMPRE null, nunca o valor calculado. A suposição documentada na
-- migration 0012 (de que NEW já viria com o valor computado) estava
-- errada, e é isso que causava "null value in column hp_atual violates
-- not-null constraint" tanto no INSERT como no UPDATE.
--
-- Fix: em vez de ler NEW.hp_total/NEW.sanidade (sempre null neste
-- ponto), calculamos o valor manualmente a partir da mesma fórmula das
-- colunas geradas (hp_dado_1d6 + 8 + atributo_con, e 10 - atributo_int),
-- usando os campos normais de NEW/OLD, que estão sempre disponíveis num
-- trigger BEFORE (só as colunas geradas é que não estão).
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
  'Repõe hp_atual/sanidade_atual ao máximo quando CON/INT mudam (e portanto hp_total/sanidade mudam). Calcula os valores manualmente a partir da mesma fórmula das colunas geradas, em vez de ler NEW.hp_total/NEW.sanidade — que estão sempre null dentro de um trigger BEFORE, por serem colunas "generated always as stored" só materializadas depois dos triggers BEFORE ROW terminarem.';

-- Corrige quaisquer linhas que tenham ficado nulas por causa do bug
-- original (defesa adicional, já parcialmente coberta por 0014).
update public.characters
set hp_atual = hp_dado_1d6 + 8 + atributo_con
where hp_atual is null;

update public.characters
set sanidade_atual = 10 - atributo_int
where sanidade_atual is null;
