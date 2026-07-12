-- ============================================================================
-- 0014_fix_hp_sanidade_atual_nulos.sql
-- BUG: fichas existentes ficaram com hp_atual/sanidade_atual = NULL depois
-- da migration 0012, em vez de = hp_total/sanidade como previsto. Ao
-- tentar incrementar (hp_atual + 1), null + 1 = null, e o NOT NULL
-- constraint rejeita a escrita com "violates not-null constraint".
--
-- Reaplica o preenchimento para qualquer linha ainda nula, e reforça o
-- trigger para nunca deixar hp_atual/sanidade_atual ficarem nulos,
-- mesmo que um futuro UPDATE os tente limpar por engano.
-- ============================================================================

update public.characters
set hp_atual = hp_total
where hp_atual is null;

update public.characters
set sanidade_atual = sanidade
where sanidade_atual is null;

-- Reforço do trigger: além do reset quando o máximo muda, garante que
-- hp_atual/sanidade_atual nunca ficam null (defesa em profundidade —
-- cobre o caso de uma escrita futura que, por engano, tente gravar null
-- nestas colunas).
create or replace function public.reset_recursos_ao_mudar_maximo()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.hp_atual := coalesce(new.hp_atual, new.hp_total);
    new.sanidade_atual := coalesce(new.sanidade_atual, new.sanidade);
    return new;
  end if;

  -- tg_op = 'UPDATE'
  if new.hp_total is distinct from old.hp_total then
    new.hp_atual := new.hp_total;
  elsif new.hp_atual is null then
    new.hp_atual := old.hp_atual;
  end if;

  if new.sanidade is distinct from old.sanidade then
    new.sanidade_atual := new.sanidade;
  elsif new.sanidade_atual is null then
    new.sanidade_atual := old.sanidade_atual;
  end if;

  return new;
end;
$$;

comment on function public.reset_recursos_ao_mudar_maximo() is
  'Repõe hp_atual/sanidade_atual ao máximo quando hp_total/sanidade mudam, e nunca deixa estas colunas ficarem null (defesa em profundidade após o bug corrigido em 0014).';
