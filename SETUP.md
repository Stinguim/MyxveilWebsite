# Setup — Myxveil (Passo 1: Next.js + Supabase)

## O que já está feito

- Projeto Next.js 15 (App Router, TypeScript, Tailwind CSS) criado.
- `@supabase/supabase-js` e `@supabase/ssr` instalados.
- Clientes Supabase configurados:
  - `src/lib/supabase/client.ts` — para Client Components
  - `src/lib/supabase/server.ts` — para Server Components / Route Handlers / Server Actions
  - `src/lib/supabase/middleware.ts` + `src/middleware.ts` — refresh de sessão e proteção de rotas (`/fichas`, `/perfil`, `/admin` exigem login)
- Schema SQL completo em `supabase/migrations/`, cobrindo:
  1. `0001_profiles_and_roles.sql` — perfis, papel `criador`/`jogador`, trigger de auto-criação de perfil no registo
  2. `0002_characters.sql` — fichas de personagem (todos os campos da secção 4 da spec), com `hp_total`, `sanidade` e `movimento` como colunas geradas automaticamente
  3. `0003_character_relations.sql` — grafo de relações + tabela `groups` para os "super-nós"
  4. `0004_wiki_pages.sql` — páginas de wiki com suporte para rascunhos não publicados
  5. `0005_character_art.sql` — metadados da galeria de arte + bucket de Storage `character-art`

Todas as tabelas têm Row Level Security ativado, de acordo com a secção 3 da spec:
jogadores só editam o que lhes pertence (`owner_id = auth.uid()`); o CRIADOR
(role especial, único registo possível) ultrapassa essas restrições.

## Passos manuais que tens de fazer

### 1. Criar o projeto no Supabase

1. Cria uma conta/projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings > API**, copia o `Project URL` e a `anon public key`.
3. Copia `.env.local.example` para `.env.local` e preenche esses dois valores.

### 2. Correr as migrations

Via [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
npx supabase login
npx supabase link --project-ref <o-teu-project-ref>
npx supabase db push
```

Ou, mais simples para já: abre o **SQL Editor** no dashboard do Supabase e
corre o conteúdo de cada ficheiro em `supabase/migrations/`, por ordem
numérica (0001, 0002, 0003, 0004, 0005).

### 3. Ativar Discord OAuth

1. No [Discord Developer Portal](https://discord.com/developers/applications), cria uma aplicação.
2. Em **OAuth2**, adiciona este Redirect URI (substitui pelo teu Project URL):
   `https://xxxxxxxxxxxx.supabase.co/auth/v1/callback`
3. Copia o `Client ID` e `Client Secret`.
4. No dashboard do Supabase: **Authentication > Providers > Discord**, ativa e cola essas credenciais.

Email/password já vem ativo por omissão no Supabase — não precisas de configurar nada extra para essa opção.

### 4. Definir o CRIADOR

Depois de te registares uma vez (por email ou Discord), corre no SQL Editor:

```sql
update public.profiles set role = 'criador' where id = '<o-teu-user-id>';
```

(O índice único `one_criador_only` garante que só pode existir um.)

### 5. Correr localmente

```bash
npm run dev
```

## Decisões em aberto que ficaram por resolver no passo 1

- **HP no nível 1** (secção 4.6): implementei `hp_dado_1d6` como coluna
  editável (default 4 = valor médio de 1d6) e `hp_total` como coluna gerada
  a partir dela. Fica por decidir, no passo 3 (CRUD de fichas), se a UI
  deve rolar este dado automaticamente na criação ou deixar fixo em 4.
- **Registo aberto**: como não há convites a validar, o Supabase Auth já
  trata disto por omissão (basta não desativar sign-ups).

---

## Passo 2 — Autenticação + roles

### O que foi construído

- **`/login`** — entrar com email/password ou Discord.
- **`/registo`** — criar conta com email/password ou Discord (registo aberto).
- **`/registo/confirma-o-teu-email`** — página mostrada após registo por email.
- **`/auth/callback`** — troca o `code` OAuth (Discord) por uma sessão.
- **`/auth/confirm`** — confirma o email a partir do link enviado no registo.
- **`/auth/auth-error`** — página de erro genérica do fluxo de auth.
- **`/perfil`** — edição dos campos da secção 4.1 (nome/alcunha, experiência
  RPG) e gestão de identidades associadas (Discord ↔ email/password),
  incluindo associar e desassociar, com proteção contra ficar sem nenhum
  método de login.
- **`/fichas`** e **`/admin`** — placeholders protegidos (o CRUD real vem
  no passo 3); `/admin` só é acessível ao CRIADOR.
- **Navbar** com estado de sessão (mostra "Entrar/Criar conta" ou
  "Fichas/Admin/Perfil/Sair" consoante o login).
- **`src/lib/auth/current-user.ts`** — helper `getCurrentUser()` para obter
  utilizador + perfil (com role) em Server Components.

### Antes de testar, confirma estas definições no dashboard do Supabase

1. **Authentication > Sign In / Providers > Discord** — deve estar ativo,
   com o Client ID/Secret do Discord Developer Portal (ver passo 1).
2. **Authentication > Sign In / Providers > (geral)** — "Allow manual
   linking" deve estar ativo (já confirmaste que sim).
3. **Authentication > URL Configuration** — adiciona
   `http://localhost:3000/auth/callback` e `http://localhost:3000/auth/confirm`
   à lista de **Redirect URLs**. Sem isto, o Supabase recusa o redirect
   mesmo com o Client ID/Secret certos.

### Como testar

```bash
npm run dev
```

1. Vai a `/registo`, cria uma conta por email. Confirma o email (chega à
   caixa de correio — em dev, o Supabase usa um servidor de email limitado
   por hora; se não chegar, verifica em **Authentication > Users** no
   dashboard se o utilizador já aparece como confirmado manualmente).
2. Depois de confirmado, entra em `/login`.
3. Vai a `/perfil`, preenche o nome/alcunha e a experiência de RPG, grava.
4. Ainda em `/perfil`, clica **Associar Discord** — deves ser redirecionado
   ao Discord e voltar já com as duas identidades listadas.
5. Testa também o caminho inverso: regista-te só por Discord, depois
   associa um email/password em `/perfil`.
6. Tenta desassociar uma identidade quando só tens uma — deve mostrar o
   erro "não podes remover o último método de login".

### Tornar-te CRIADOR

Depois de teres pelo menos uma conta registada, no **SQL Editor** do
Supabase:

```sql
update public.profiles set role = 'criador' where id = '<o-teu-user-id>';
```

(Encontras o `id` em **Authentication > Users** no dashboard, ou correndo
`select id, email from auth.users;` no SQL Editor.) Depois de definido,
recarrega a página — a navbar passa a mostrar o link **Admin**, e
`/admin` deixa de dar "página não encontrada".

### Decisões em aberto para o passo 3

- A validação de que os atributos (secção 4.4) somam exatamente 9 pontos
  a nível 1 ainda não está implementada em lado nenhum — fica para o CRUD
  de fichas.
- O envio de emails de confirmação usa o servidor de email de teste do
  Supabase, que tem limites baixos de envio. Para produção, vale a pena
  configurar SMTP próprio em **Authentication > Emails > SMTP Settings**.

### Correção conhecida: discord_username ficava NULL

O trigger inicial lia a chave errada dos metadados do Discord
(`user_name`, que não existe nesse provider — essa chave é de outros,
como o GitHub). Os metadados reais do Discord vêm assim:

```json
{
  "full_name": "stinguim",
  "custom_claims": { "global_name": "Stinguim" }
}
```

Se já corriste as migrations 0001-0005 antes desta correção, corre
também `supabase/migrations/0006_fix_discord_username.sql` no SQL
Editor. Corrige o trigger para o futuro e repõe automaticamente o
`discord_username` de qualquer conta já criada que tenha ficado com
NULL.

### Testes gratuitos, sem envio de email

Se o email de confirmação de registo não chegar (o servidor de email de
teste do Supabase tem limites baixos e pode demorar/falhar), confirma o
utilizador manualmente: **Authentication > Users**, procura o
utilizador, e usa a opção de confirmar o email diretamente no
dashboard.

---

## Passo 3 — CRUD de fichas de personagem

### Migrations novas a correr

Corre por ordem no **SQL Editor**, depois das anteriores:

1. `0007_character_visibility.sql` — adiciona a coluna `visibilidade`
   (pública/privada), independente do `estado`. Regra: uma ficha só é
   visível a outros jogadores quando é **pública E aprovada**. Privada
   esconde de todos exceto o dono e o CRIADOR, seja qual for o estado.
2. `0008_characters_with_owner.sql` — view `characters_with_owner`, que
   junta cada ficha ao nome/alcunha (ou username Discord) do dono, para
   a UI mostrar "criado por X" sem join manual.
3. `0009_ensure_data_api_grants.sql` — **importante**: o Supabase mudou
   a plataforma a partir de finais de maio de 2026 e projetos novos já
   não expõem tabelas/views à Data API automaticamente. Esta migration
   garante os GRANTs explícitos necessários. Se as tuas queries
   devolverem sempre vazio ou erro "relation does not exist" através do
   site (mas funcionarem no SQL Editor), é isto que falta.

Se já tinhas corrido 0001-0006 antes desta atualização, corre só as
migrations 0007, 0008 e 0009 a seguir.

### O que foi construído

- **`/fichas`** — listagem com pesquisa (nome, campanha, dono) e filtros
  (estado, "só as minhas"), sincronizados com a URL.
- **`/fichas/nova`** — criação de ficha.
- **`/fichas/[id]`** — edição de ficha com:
  - **Auto-save** (QoL): grava sozinho ~1.2s depois de qualquer
    alteração, sem precisares de clicar em "Guardar". Indicador
    "A guardar…/Guardado/Erro" visível.
  - **Contador de atributos em tempo real** (QoL): mostra "X/9 pontos
    usados" e avisa (sem bloquear) se ultrapassares o total sugerido
    para nível 1.
  - **Pré-visualização em modo ficha** (QoL): botão que troca o
    formulário por uma vista de leitura, como a ficha aparece a outros
    jogadores.
  - **Duplicar ficha** (QoL): cria uma cópia em rascunho com "(cópia)"
    no nome — útil para NPCs parecidos ou adaptar a nova campanha.
  - Botões de estado: Submeter → Aprovar (só CRIADOR) → Arquivar
    (personagem morto) → Desarquivar, e "Devolver a rascunho".
  - Toggle de **visibilidade pública/privada**, só visível ao dono.
  - Apagar definitivamente (só CRIADOR, com confirmação).
- Stats calculados (HP, Sanidade, Movimento) mostrados como só-leitura,
  recalculados automaticamente pela BD ao guardar.

### Regras de acesso (RLS) confirmadas neste passo

- Jogador vê: fichas **públicas + aprovadas** de todos, e **todas as
  suas próprias** fichas (qualquer estado/visibilidade).
- CRIADOR vê e edita **tudo**, sempre — incluindo fichas privadas de
  qualquer jogador.
- Só o CRIADOR aprova fichas e as apaga definitivamente.
- Jogador só edita as suas próprias fichas.

### Como testar

```bash
npm run dev
```

1. Em `/fichas/nova`, cria uma ficha, preenche o nome e alguns
   atributos — repara no contador "X/9 pontos usados".
2. Guarda (botão "Criar ficha"). És redirecionado para `/fichas/[id]`.
3. Muda um campo qualquer e sai do campo (ou espera ~1.2s depois de
   mexeres num atributo) — o indicador deve passar a "A guardar…" e
   depois "Guardado", sem teres clicado em nada.
4. Clica em "Pré-visualizar" para ver a ficha em modo leitura.
5. Marca a ficha como **Privada** (botão junto ao estado) — confirma que
   deixa de aparecer para outro jogador em `/fichas`, mas continua
   visível para ti e para o CRIADOR.
6. Clica em "Submeter para aprovação". Inicia sessão como CRIADOR
   (noutro browser/aba anónima) e confirma que consegues "Aprovar" a
   ficha em `/fichas/[id]`.
7. Testa "Duplicar" — deve criar uma segunda ficha "(cópia)" em
   rascunho.
8. Testa os filtros em `/fichas`: pesquisa por nome, filtra por estado,
   alterna "Só as minhas".

### Decisões em aberto para os próximos passos

- **Validação de 9 pontos**: o contador avisa mas não bloqueia — o
  servidor aceita qualquer distribuição 0-4 por atributo. Se quiseres
  bloquear mesmo a submissão acima de 9 pontos, é uma alteração pequena
  em `criarFicha`/`atualizarFicha`.
- **Rolar o dado de HP**: continua fixo em 4 (valor médio) na criação.
  Ainda não há botão de "rolar 1d6" na UI.
- **Modularidade da ficha** (secções colapsáveis/reordenáveis por
  jogador): decidiste deixar para depois — fica como ideia para um
  passo futuro, guardando a preferência em `profiles.ui_preferences`
  (jsonb) ou tabela própria, sem tocar nos dados de jogo.
- A wiki de lore (secção 6) e o mapa de relações (secção 5) ainda não
  têm UI — só o schema da BD (migrations 0003 e 0004) já existe.

---

## Revisão de código — correções aplicadas

Antes do passo 4, revi todo o código dos passos 1-3 à procura de falhas.
Encontrei e corrigi 8 problemas. Nenhum exige ação tua na UI — só correr
as migrations novas.

### Migrations novas a correr (por ordem, depois das anteriores)

1. **`0010_fix_profiles_role_escalation.sql`** — **falha de segurança**:
   a policy de update de `profiles` permitia que qualquer jogador
   alterasse a sua própria coluna `role`, incluindo tornar-se CRIADOR.
   O índice único só impedia dois criadores ao mesmo tempo, não a
   tentativa em si. Corrigido: a policy agora impede alterar `role` via
   RLS; só muda por SQL Editor.
2. **`0011_fix_private_character_leaks.sql`** — **fuga de dados**: o
   mapa de relações e a galeria de arte mostravam a todos os
   autenticados relações/imagens ligadas a fichas privadas de outros
   jogadores, revelando indiretamente a sua existência. Corrigido: só
   mostra se a ficha associada for visível ao utilizador atual.

### Outras correções (só no código da aplicação, sem migration)

- **RLS bloqueava em silêncio**: `atualizarFicha`, `aprovarFicha`,
  `arquivarFicha`, `alternarVisibilidade` e `apagarFicha` não detetavam
  quando a RLS bloqueava uma operação — o Supabase devolve "sucesso, 0
  linhas afetadas" em vez de erro nesses casos. A UI podia mostrar
  "Guardado"/sucesso mesmo sem nada ter mudado. Corrigido: todas pedem a
  linha de volta com `.select().maybeSingle()` e reportam erro explícito
  se vier vazia.
- **`.single()` em vez de `.maybeSingle()`** na leitura de uma ficha
  específica: zero resultados (ficha privada de outro jogador, ou id
  inexistente) é um caso normal aqui, não um erro de query. Corrigido em
  `/fichas/[id]`.
- **Ações não atualizavam a UI**: depois de Submeter/Aprovar/Arquivar/
  Duplicar/alternar Visibilidade/desassociar identidade, os botões e
  stats calculados (HP/Sanidade/Movimento) continuavam a mostrar o
  estado antigo até um refresh manual da página. Corrigido com
  `router.refresh()` depois de cada ação bem-sucedida.
- **Pesquisa na listagem de fichas** podia rebentar com erro 400 se o
  termo pesquisado contivesse vírgulas, parênteses ou os símbolos `%`/`*`
  (têm significado especial no filtro `.or()`/`ilike` do PostgREST).
  Corrigido: esses caracteres são neutralizados antes de montar a query.
- **Redirect de `/registo` a apanhar `/registo/confirma-o-teu-email`**:
  quem via essa página de "confirma o teu email" já autenticado por
  outro motivo era redirecionado para longe sem a ver. Corrigido: o
  proxy agora compara a rota exata, não por prefixo.

### O que ainda fica só documentado (sem UI para corrigir já)

- O bucket de Storage `character-art` continua público — qualquer
  pessoa com o URL direto vê a imagem, mesmo sem sessão. Aceitável para
  arte de fichas públicas, mas contradiz "privada" enquanto não houver
  UI de upload. Fica anotado em `0011_fix_private_character_leaks.sql`
  para tratar quando construíres essa funcionalidade (bucket privado +
  signed URLs).
