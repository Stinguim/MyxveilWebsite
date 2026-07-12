-- ============================================================================
-- 0010_fix_profiles_role_escalation.sql
-- FALHA DE SEGURANÇA: a policy "profiles_update_own" original permitia a
-- qualquer utilizador autenticado alterar a sua PRÓPRIA coluna `role`,
-- incluindo mudar-se a si próprio para 'criador'. O índice único
-- one_criador_only só impede DOIS criadores simultâneos — não impede a
-- tentativa em si, e se o CRIADOR alguma vez deixasse de o ser (ou saísse
-- da plataforma), o primeiro jogador a tentar ocuparia o lugar.
--
-- Fix: a policy de update deixa de poder alterar `role` — só um trigger
-- explícito (correndo com privilégios elevados) pode fazê-lo, e continua
-- a ser preciso correr esse UPDATE manualmente no SQL Editor.
-- ============================================================================

drop policy if exists "profiles_update_own" on public.profiles;

-- Um utilizador só pode editar o seu próprio perfil, E a coluna `role`
-- tem de permanecer inalterada em relação ao valor já guardado na BD.
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  );

comment on policy "profiles_update_own" on public.profiles is
  'Um utilizador edita o seu próprio perfil, mas nunca a coluna role — isso só muda via SQL Editor/service role.';
