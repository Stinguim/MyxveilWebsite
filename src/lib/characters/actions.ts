"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  Character,
  Classe,
  Especie,
  ElementoParanormal,
  EstadoFicha,
  Genero,
  Origem,
  VisibilidadeFicha,
} from "@/lib/characters/types";

type ActionResult = { error: string } | { success: true; id: string };

/**
 * Lê e valida os campos de uma ficha a partir de um FormData. Devolve os
 * campos prontos a inserir/atualizar, ou uma mensagem de erro.
 *
 * Nota: os atributos não são forçados a somar exatamente 9 aqui — é
 * avisado na UI (QoL de contador em tempo real) mas não bloqueado no
 * servidor, porque o CRIADOR pode querer excecionalmente permitir
 * distribuições diferentes (personagens de nível mais alto, NPCs, etc).
 */
type ParsedCharacterFields = {
  nome: string;
  idade: number | null;
  altura: string | null;
  genero: Genero | null;
  genero_outro: string | null;
  especie: Especie | null;
  especie_outro: string | null;
  origem: Origem | null;
  origem_outro: string | null;
  aparencia: string | null;
  rotina_diaria: string | null;
  o_que_o_deixa_feliz: string | null;
  como_se_move: string | null;
  maior_desejo_objetivo: string | null;
  maior_medo_inseguranca: string | null;
  memoria_recorrente: string | null;
  talento_mundano: string | null;
  comportamento_sob_pressao: string | null;
  primeira_interacao_paranormal: string | null;
  group_id: string | null;
  grupo_pedido_outro: string | null;
  lore_adicional: string | null;
  midia_inspirada_texto: string | null;
  atributo_for: number;
  atributo_int: number;
  atributo_des: number;
  atributo_car: number;
  atributo_con: number;
  atributo_sp: number;
  classe_principal: Classe | null;
  classe_principal_nivel: number | null;
  classe_secundaria: Classe | null;
  classe_secundaria_nivel: number | null;
  arma: string | null;
  elemento_paranormal: ElementoParanormal | null;
  elemento_paranormal_outro: string | null;
  habilidade_1: string | null;
  habilidade_2: string | null;
  campanha: string | null;
  visibilidade: VisibilidadeFicha;
};

function parseCharacterForm(
  formData: FormData
): { error: string } | ParsedCharacterFields {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) {
    return { error: "O nome do personagem é obrigatório." };
  }

  const idadeRaw = String(formData.get("idade") ?? "").trim();
  const idade = idadeRaw ? Number(idadeRaw) : null;
  if (idade !== null && (Number.isNaN(idade) || idade < 0)) {
    return { error: "A idade tem de ser um número válido." };
  }

  const readEnum = <T extends string>(key: string): T | null => {
    const v = String(formData.get(key) ?? "").trim();
    return v ? (v as T) : null;
  };

  const readAtributo = (key: string): number => {
    const v = Number(formData.get(key) ?? 0);
    return Number.isFinite(v) ? Math.min(4, Math.max(0, Math.round(v))) : 0;
  };

  const readNivel = (key: string): number | null => {
    const v = String(formData.get(key) ?? "").trim();
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(5, Math.max(1, Math.round(n))) : null;
  };

  // Grupo: o select no formulário usa "" = nenhum, "outro" = pedido de
  // grupo novo (texto livre em grupo_pedido_outro), ou o uuid de um
  // group existente. Nunca os dois (group_id e grupo_pedido_outro)
  // preenchidos ao mesmo tempo.
  const grupoSelecionado = String(formData.get("group_id") ?? "").trim();
  const group_id =
    grupoSelecionado && grupoSelecionado !== "outro" ? grupoSelecionado : null;
  const grupo_pedido_outro =
    grupoSelecionado === "outro"
      ? String(formData.get("grupo_pedido_outro") ?? "").trim() || null
      : null;

  return {
    nome,
    idade,
    altura: String(formData.get("altura") ?? "").trim() || null,
    genero: readEnum<Genero>("genero"),
    genero_outro: String(formData.get("genero_outro") ?? "").trim() || null,
    especie: readEnum<Especie>("especie"),
    especie_outro: String(formData.get("especie_outro") ?? "").trim() || null,
    origem: readEnum<Origem>("origem"),
    origem_outro: String(formData.get("origem_outro") ?? "").trim() || null,
    aparencia: String(formData.get("aparencia") ?? "").trim() || null,

    rotina_diaria: String(formData.get("rotina_diaria") ?? "").trim() || null,
    o_que_o_deixa_feliz:
      String(formData.get("o_que_o_deixa_feliz") ?? "").trim() || null,
    como_se_move: String(formData.get("como_se_move") ?? "").trim() || null,
    maior_desejo_objetivo:
      String(formData.get("maior_desejo_objetivo") ?? "").trim() || null,
    maior_medo_inseguranca:
      String(formData.get("maior_medo_inseguranca") ?? "").trim() || null,
    memoria_recorrente:
      String(formData.get("memoria_recorrente") ?? "").trim() || null,
    talento_mundano: String(formData.get("talento_mundano") ?? "").trim() || null,
    comportamento_sob_pressao:
      String(formData.get("comportamento_sob_pressao") ?? "").trim() || null,
    primeira_interacao_paranormal:
      String(formData.get("primeira_interacao_paranormal") ?? "").trim() ||
      null,
    group_id,
    grupo_pedido_outro,
    lore_adicional: String(formData.get("lore_adicional") ?? "").trim() || null,
    midia_inspirada_texto:
      String(formData.get("midia_inspirada_texto") ?? "").trim() || null,

    atributo_for: readAtributo("atributo_for"),
    atributo_int: readAtributo("atributo_int"),
    atributo_des: readAtributo("atributo_des"),
    atributo_car: readAtributo("atributo_car"),
    atributo_con: readAtributo("atributo_con"),
    atributo_sp: readAtributo("atributo_sp"),

    classe_principal: readEnum<Classe>("classe_principal"),
    classe_principal_nivel: readNivel("classe_principal_nivel"),
    classe_secundaria: readEnum<Classe>("classe_secundaria"),
    classe_secundaria_nivel: readNivel("classe_secundaria_nivel"),

    arma: String(formData.get("arma") ?? "").trim() || null,
    elemento_paranormal: readEnum<ElementoParanormal>("elemento_paranormal"),
    elemento_paranormal_outro:
      String(formData.get("elemento_paranormal_outro") ?? "").trim() || null,
    habilidade_1: String(formData.get("habilidade_1") ?? "").trim() || null,
    habilidade_2: String(formData.get("habilidade_2") ?? "").trim() || null,

    campanha: String(formData.get("campanha") ?? "").trim() || null,
    visibilidade: (readEnum<VisibilidadeFicha>("visibilidade") ??
      "publica") as VisibilidadeFicha,
  };
}

export async function criarFicha(formData: FormData): Promise<ActionResult> {
  const current = await getCurrentUser();
  if (!current) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const parsed = parseCharacterForm(formData);
  if ("error" in parsed) return parsed;

  // Auto-aprovação para o CRIADOR: fichas criadas pelo próprio DM nascem
  // já em 'aprovada', sem passar por rascunho/submetida — não faz
  // sentido o CRIADOR submeter uma ficha a si próprio para aprovação. A
  // RLS ("characters_update") já permite estado='aprovada' quando
  // is_criador() é verdadeiro, por isso isto é seguro mesmo se alguém
  // tentasse forçar o campo via um pedido manual.
  const isCriador = current.profile.role === "criador";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("characters")
    .insert({
      ...parsed,
      owner_id: current.user.id,
      ...(isCriador ? { estado: "aprovada" as const } : {}),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Não foi possível criar a ficha. Tenta novamente." };
  }

  // Se o CRIADOR criou já com um pedido de grupo novo ("outro"), cria o
  // grupo de imediato — a ficha já nasce aprovada, por isso não faz
  // sentido esperar por uma "aprovação" que já aconteceu.
  if (isCriador && parsed.grupo_pedido_outro) {
    await materializarGrupoPedido(data.id, parsed.grupo_pedido_outro);
  }

  revalidatePath("/fichas");
  redirect(`/fichas/${data.id}`);
}

/**
 * Atualiza uma ficha existente. Usado tanto pelo botão "Guardar" como
 * pelo auto-save (QoL). Não altera 'estado' — isso é feito por ações
 * dedicadas (submeterFicha, aprovarFicha, arquivarFicha).
 *
 * Nota importante: um .update() bloqueado pela RLS (ex: chamado com o id
 * de uma ficha que não é tua) NÃO gera erro — devolve sucesso com 0
 * linhas afetadas. Por isso pedimos sempre a linha de volta com
 * .select().maybeSingle(): se vier null sem erro, sabemos que a RLS
 * bloqueou silenciosamente e reportamos isso como erro ao utilizador.
 */
export async function atualizarFicha(
  characterId: string,
  formData: FormData
): Promise<{ error: string } | { success: true; character: Character }> {
  const current = await getCurrentUser();
  if (!current) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const parsed = parseCharacterForm(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("characters")
    .update(parsed)
    .eq("id", characterId)
    .select("*")
    .maybeSingle<Character>();

  if (error) {
    return { error: "Não foi possível guardar as alterações." };
  }

  if (!data) {
    return {
      error: "Não tens permissão para editar esta ficha.",
    };
  }

  revalidatePath(`/fichas/${characterId}`);
  revalidatePath("/fichas");
  return { success: true, character: data };
}

/**
 * Cria (ou reaproveita, se já existir com o mesmo nome) um grupo em
 * public.groups a partir de um pedido de texto livre, e liga a ficha a
 * ele via group_id, limpando grupo_pedido_outro. Chamado quando o
 * CRIADOR aprova uma ficha com um pedido de grupo pendente, ou quando o
 * próprio CRIADOR cria/edita uma ficha já aprovada com esse pedido.
 */
async function materializarGrupoPedido(
  characterId: string,
  nomeGrupoPedido: string
): Promise<void> {
  const supabase = await createClient();

  const { data: grupoExistente } = await supabase
    .from("groups")
    .select("id")
    .eq("nome", nomeGrupoPedido)
    .maybeSingle();

  let groupId = grupoExistente?.id as string | undefined;

  if (!groupId) {
    const { data: grupoNovo } = await supabase
      .from("groups")
      .insert({ nome: nomeGrupoPedido })
      .select("id")
      .maybeSingle();
    groupId = grupoNovo?.id;
  }

  if (!groupId) return; // RLS bloqueou ou outro erro silencioso — não interrompe o fluxo de aprovação.

  await supabase
    .from("characters")
    .update({ group_id: groupId, grupo_pedido_outro: null })
    .eq("id", characterId);

  revalidatePath("/mapa");
  revalidatePath("/admin/mapa");
}

async function mudarEstado(
  characterId: string,
  novoEstado: EstadoFicha
): Promise<{ error: string } | { success: true; character: Character }> {
  const current = await getCurrentUser();
  if (!current) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("characters")
    .update({ estado: novoEstado })
    .eq("id", characterId)
    .select("*")
    .maybeSingle<Character>();

  if (error) {
    return { error: "Não foi possível atualizar o estado da ficha." };
  }

  if (!data) {
    return { error: "Não tens permissão para fazer essa alteração." };
  }

  revalidatePath(`/fichas/${characterId}`);
  revalidatePath("/fichas");
  return { success: true, character: data };
}

export async function submeterFicha(characterId: string) {
  return mudarEstado(characterId, "submetida");
}

/**
 * Só o CRIADOR consegue de facto executar isto, a policy
 * "characters_update" só permite estado='aprovada' quando
 * public.is_criador() é verdadeiro. Se um jogador chamar isto na sua
 * própria ficha, a RLS bloqueia e devolvemos o erro explícito acima
 * (em vez do falso "sucesso" que existia antes desta revisão).
 *
 * Também materializa um pedido de grupo pendente (grupo_pedido_outro):
 * ao aprovar, se a ficha ainda não tiver group_id mas tiver um pedido
 * de texto livre, o grupo é criado em public.groups (ou reaproveitado
 * se já existir com o mesmo nome) e a ficha passa a apontar para ele.
 */
export async function aprovarFicha(characterId: string) {
  const resultado = await mudarEstado(characterId, "aprovada");
  if ("success" in resultado && resultado.character.grupo_pedido_outro) {
    await materializarGrupoPedido(characterId, resultado.character.grupo_pedido_outro);
    revalidatePath(`/fichas/${characterId}`);
  }
  return resultado;
}

export async function arquivarFicha(characterId: string) {
  return mudarEstado(characterId, "arquivada");
}

export async function voltarParaRascunho(characterId: string) {
  return mudarEstado(characterId, "rascunho");
}

export async function alternarVisibilidade(
  characterId: string,
  novaVisibilidade: VisibilidadeFicha
): Promise<{ error: string } | { success: true; character: Character }> {
  const current = await getCurrentUser();
  if (!current) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("characters")
    .update({ visibilidade: novaVisibilidade })
    .eq("id", characterId)
    .select("*")
    .maybeSingle<Character>();

  if (error) {
    return { error: "Não foi possível atualizar a visibilidade." };
  }

  if (!data) {
    return { error: "Não tens permissão para alterar a visibilidade desta ficha." };
  }

  revalidatePath(`/fichas/${characterId}`);
  revalidatePath("/fichas");
  return { success: true, character: data };
}

export async function apagarFicha(
  characterId: string
): Promise<{ error: string } | void> {
  const current = await getCurrentUser();
  if (!current) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("characters")
    .delete()
    .eq("id", characterId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "Não foi possível apagar a ficha." };
  }

  if (!data) {
    return { error: "Não tens permissão para apagar esta ficha." };
  }

  revalidatePath("/fichas");
  redirect("/fichas");
}

/**
 * Duplica uma ficha existente (QoL): copia todos os campos para uma nova
 * ficha em rascunho, pertencente ao utilizador atual, com "(cópia)" no
 * nome. Útil para NPCs parecidos ou adaptar um personagem a nova
 * campanha.
 *
 * Nota: mesmo que quem duplique seja o CRIADOR, a cópia nasce em
 * 'rascunho' propositadamente, só a criação original via formulário
 * aplica a auto-aprovação, para não haver aprovações "invisíveis" em
 * massa ao duplicar fichas de outros jogadores. Por consistência, também
 * não materializa pedidos de grupo pendentes aqui (fica para quando a
 * cópia for de facto aprovada).
 */
export async function duplicarFicha(original: Character): Promise<ActionResult> {
  const current = await getCurrentUser();
  if (!current) {
    return { error: "Sessão expirada. Inicia sessão novamente." };
  }

  const copiavel = {
    nome: `${original.nome} (cópia)`,
    idade: original.idade,
    altura: original.altura,
    genero: original.genero,
    genero_outro: original.genero_outro,
    especie: original.especie,
    especie_outro: original.especie_outro,
    origem: original.origem,
    origem_outro: original.origem_outro,
    aparencia: original.aparencia,
    rotina_diaria: original.rotina_diaria,
    o_que_o_deixa_feliz: original.o_que_o_deixa_feliz,
    como_se_move: original.como_se_move,
    maior_desejo_objetivo: original.maior_desejo_objetivo,
    maior_medo_inseguranca: original.maior_medo_inseguranca,
    memoria_recorrente: original.memoria_recorrente,
    talento_mundano: original.talento_mundano,
    comportamento_sob_pressao: original.comportamento_sob_pressao,
    primeira_interacao_paranormal: original.primeira_interacao_paranormal,
    group_id: original.group_id,
    grupo_pedido_outro: original.grupo_pedido_outro,
    lore_adicional: original.lore_adicional,
    midia_inspirada_texto: original.midia_inspirada_texto,
    atributo_for: original.atributo_for,
    atributo_int: original.atributo_int,
    atributo_des: original.atributo_des,
    atributo_car: original.atributo_car,
    atributo_con: original.atributo_con,
    atributo_sp: original.atributo_sp,
    classe_principal: original.classe_principal,
    classe_principal_nivel: original.classe_principal_nivel,
    classe_secundaria: original.classe_secundaria,
    classe_secundaria_nivel: original.classe_secundaria_nivel,
    hp_dado_1d6: original.hp_dado_1d6,
    arma: original.arma,
    elemento_paranormal: original.elemento_paranormal,
    elemento_paranormal_outro: original.elemento_paranormal_outro,
    habilidade_1: original.habilidade_1,
    habilidade_2: original.habilidade_2,
    campanha: original.campanha,
    visibilidade: original.visibilidade,
  };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("characters")
    .insert({
      ...copiavel,
      owner_id: current.user.id,
      estado: "rascunho" as const,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Não foi possível duplicar a ficha." };
  }

  revalidatePath("/fichas");
  redirect(`/fichas/${data.id}`);
}
