"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { atualizarFicha, criarFicha } from "@/lib/characters/actions";
import { useDebouncedEffect } from "@/lib/use-debounced-effect";
import type { Character, MidiaInspirada as MidiaInspiradaItem } from "@/lib/characters/types";
import type { ArteItem } from "@/lib/characters/arte-actions";
import { ATRIBUTOS_KEYS, nivelDominioMaisAlto } from "@/lib/characters/types";
import { AtributosEditor } from "@/components/characters/atributos-editor";
import {
  AutoSaveIndicator,
  type AutoSaveStatus,
} from "@/components/characters/autosave-indicator";
import {
  Campo,
  CampoSelect,
  CampoTexto,
  CampoTextarea,
} from "@/components/campos";
import {
  CLASSE_OPCOES,
  ELEMENTO_OPCOES,
  ESPECIE_OPCOES,
  GENERO_OPCOES,
  NIVEL_DOMINIO_LABELS,
  NIVEL_OPCOES,
  ORIGEM_OPCOES,
} from "@/components/characters/opcoes";
import { FichaPreview } from "@/components/characters/ficha-preview";
import { MidiaInspirada } from "@/components/characters/midia-inspirada";
import { GaleriaArte } from "@/components/characters/galeria-arte";
import { CampoGrupo } from "@/components/characters/campo-grupo";
import { SubmitButton } from "@/components/submit-button";

type Props = {
  /** undefined = criação de ficha nova; Character = edição com auto-save. */
  character?: Character;
  /**
   * true = utilizador atual pode editar esta ficha (é o dono, ou é o
   * CRIADOR). Quando false (ex: um jogador a ver a ficha pública de
   * outro), a ficha abre sempre em modo pré-visualização, sem hipótese
   * de voltar a editar.
   */
  podeEditar?: boolean;
  /** URL pública do retrato, ou null se não tiver. Passada ao FichaPreview. */
  retratoUrl?: string | null;
  /** Itens da mini-galeria de mídia inspirada, já com URL pública. */
  midiaInspiradaItens?: (MidiaInspiradaItem & { url: string })[];
  /** Itens da galeria de arte pública, já com URL pública. */
  arteItens?: (ArteItem & { url: string })[];
  /** Nome do grupo já resolvido (via group_id), passado pelo Server Component pai. */
  grupoNome?: string | null;
};

const nivelOpcoesLabeled: [string, string][] = NIVEL_OPCOES.map((n) => [
  String(n),
  NIVEL_DOMINIO_LABELS[n],
]);

export function FormFicha({
  character,
  podeEditar = true,
  retratoUrl = null,
  midiaInspiradaItens = [],
  arteItens = [],
  grupoNome = null,
}: Props) {
  const isEdicao = Boolean(character);
  const [modoPreview, setModoPreview] = useState(!podeEditar && isEdicao);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const [isPending, startTransition] = useTransition();
  const [errorCriar, setErrorCriar] = useState<string | null>(null);
  const router = useRouter();

  const [atributos, setAtributos] = useState({
    atributo_for: character?.atributo_for ?? 0,
    atributo_int: character?.atributo_int ?? 0,
    atributo_des: character?.atributo_des ?? 0,
    atributo_car: character?.atributo_car ?? 0,
    atributo_con: character?.atributo_con ?? 0,
    atributo_sp: character?.atributo_sp ?? 0,
  });

  const [genero, setGenero] = useState(character?.genero ?? "");
  const [especie, setEspecie] = useState(character?.especie ?? "");
  const [origem, setOrigem] = useState(character?.origem ?? "");
  const [grupoSelecionado, setGrupoSelecionado] = useState(
    character?.group_id ?? (character?.grupo_pedido_outro ? "outro" : "")
  );
  const [grupoPedidoOutro, setGrupoPedidoOutro] = useState(
    character?.grupo_pedido_outro ?? ""
  );
  const [elemento, setElemento] = useState(character?.elemento_paranormal ?? "");
  const [classePrincipalNivel, setClassePrincipalNivel] = useState(
    character?.classe_principal_nivel ?? 1
  );
  const [classeSecundariaNivel, setClasseSecundariaNivel] = useState(
    character?.classe_secundaria_nivel ?? 1
  );
  const nivelDominio = nivelDominioMaisAlto({
    classe_principal_nivel: classePrincipalNivel,
    classe_secundaria_nivel: classeSecundariaNivel,
  });

  const formRef = useRef<HTMLFormElement>(null);

  /**
   * Constrói o FormData a partir do DOM, mas sobrepõe os valores de
   * atributos com o React state (`atributos`), nunca com o que estiver
   * no DOM nesse instante.
   *
   * Corrige um bug em que o HP máximo (hp_total, coluna gerada a partir
   * de atributo_con) "re-rolava"/mudava sozinho ao guardar: os sliders
   * de atributo disparam onChange (atualiza o state) e onMouseUp/
   * onTouchEnd (dispara o auto-save via onCommit) muito próximos um do
   * outro, no mesmo gesto de largar o rato. O auto-save lia o FormData
   * diretamente do DOM, e nalguns casos isso acontecia antes de o React
   * terminar de sincronizar o `value` do input com o novo state,
   * capturando o valor ANTERIOR do slider. Como os inputs de atributo
   * são controlados (value={valores[key]}), a fonte da verdade correta
   * é sempre `atributos` (o state) — nunca o DOM.
   */
  const buildFormData = useCallback((): FormData => {
    const fd = new FormData(formRef.current!);
    for (const key of ATRIBUTOS_KEYS) {
      fd.set(key, String(atributos[key]));
    }
    return fd;
  }, [atributos]);

  // Auto-save (QoL): dispara ~1.2s depois da última alteração a um select
  // (género, espécie, etc). Os sliders de atributos e os selects de nível
  // de classe NÃO entram aqui — usam onCommit/onBlur explícito (ver
  // handleFieldBlur e o onCommit do AtributosEditor), porque disparar a
  // cada onChange de um <input type="range"> reiniciaria o debounce
  // dezenas de vezes por segundo durante o arrasto, e um router.refresh()
  // a meio do gesto do rato pode interromper o próprio drag do slider.
  useDebouncedEffect(
    () => {
      if (!isEdicao) return;
      void handleAutoSave();
    },
    [genero, especie, origem, grupoSelecionado, elemento],
    1200
  );

  async function handleAutoSave() {
    if (!character) return;
    setAutoSaveStatus("saving");
    const fd = buildFormData();
    const result = await atualizarFicha(character.id, fd);
    if ("error" in result) {
      setAutoSaveStatus("error");
    } else {
      setAutoSaveStatus("saved");
      // Sem isto, os stats calculados (HP/Sanidade/Movimento) mostrados
      // mais abaixo — e a pré-visualização, que usa a mesma prop
      // `character` — continuariam a mostrar valores desatualizados
      // depois de mudar um atributo, mesmo já gravados na BD, porque
      // `character` só chega a este componente como prop vinda do
      // Server Component pai.
      router.refresh();
    }
  }

  function handleFieldBlur() {
    if (!isEdicao) return;
    void handleAutoSave();
  }

  function handleAtributoChange(
    key: (typeof ATRIBUTOS_KEYS)[number],
    value: number
  ) {
    setAtributos((prev) => ({ ...prev, [key]: value }));
  }

  function handleCriar(formData: FormData) {
    setErrorCriar(null);
    // Mesma proteção que buildFormData(): garante que os atributos
    // enviados na criação são sempre os do state, não os que possam
    // estar desatualizados no DOM no instante do submit.
    for (const key of ATRIBUTOS_KEYS) {
      formData.set(key, String(atributos[key]));
    }
    startTransition(async () => {
      const result = await criarFicha(formData);
      if (result && "error" in result) {
        setErrorCriar(result.error);
      }
    });
  }

  if (modoPreview && character) {
    // A pré-visualização usa sempre o estado já guardado na BD (o
    // auto-save garante que está atualizado dentro de ~1.2s de qualquer
    // alteração), o que evita duplicar toda a lógica de leitura do
    // formulário só para montar um snapshot local.
    return (
      <div>
        {podeEditar && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setModoPreview(false)}
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
            >
              Voltar a editar
            </button>
          </div>
        )}
        <FichaPreview character={character} retratoUrl={retratoUrl} grupoNome={grupoNome} />
        <div className="mt-8">
          <GaleriaArte
            characterId={character.id}
            itens={arteItens}
            podeEditar={podeEditar}
          />
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={isEdicao ? undefined : handleCriar}
      className="space-y-10"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Base do personagem</h2>
        <div className="flex items-center gap-3">
          {isEdicao && <AutoSaveIndicator status={autoSaveStatus} />}
          {isEdicao && (
            <button
              type="button"
              onClick={() => setModoPreview(true)}
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
            >
              Pré-visualizar
            </button>
          )}
        </div>
      </div>

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onBlur={handleFieldBlur}
      >
        <Campo label="Nome do personagem *">
          <CampoTexto name="nome" defaultValue={character?.nome} />
        </Campo>
        <Campo label="Idade" hint="Recomendado entre 18 e 60, mas não obrigatório.">
          <CampoTexto name="idade" type="number" defaultValue={character?.idade} />
        </Campo>
        <Campo label="Altura" hint="Texto livre, em metros. Ex: 1,80m.">
          <CampoTexto name="altura" defaultValue={character?.altura} />
        </Campo>
        <Campo label="Género">
          <CampoSelect
            name="genero"
            defaultValue={character?.genero}
            options={GENERO_OPCOES}
            onChange={setGenero}
          />
        </Campo>
        {genero === "outro" && (
          <Campo label="Género (outro)">
            <CampoTexto name="genero_outro" defaultValue={character?.genero_outro} />
          </Campo>
        )}
        <Campo label="Espécie">
          <CampoSelect
            name="especie"
            defaultValue={character?.especie}
            options={ESPECIE_OPCOES}
            onChange={setEspecie}
          />
        </Campo>
        {especie === "outro" && (
          <Campo label="Espécie (outro)">
            <CampoTexto
              name="especie_outro"
              defaultValue={character?.especie_outro}
            />
          </Campo>
        )}
        <Campo label="Origem">
          <CampoSelect
            name="origem"
            defaultValue={character?.origem}
            options={ORIGEM_OPCOES}
            onChange={setOrigem}
          />
        </Campo>
        {origem === "outro" && (
          <Campo label="Origem (outro)">
            <CampoTexto name="origem_outro" defaultValue={character?.origem_outro} />
          </Campo>
        )}
      </section>
      <div onBlur={handleFieldBlur}>
        <Campo
          label="Aparência"
          hint="Altura, olhos, cabelo, roupa, acessórios, o que o destaca numa multidão..."
        >
          <CampoTextarea name="aparencia" defaultValue={character?.aparencia} rows={4} />
        </Campo>
      </div>

      <h2 className="text-lg font-medium">Psicológico / roleplay</h2>
      <p className="-mt-6 text-sm text-neutral-500">
        Tudo opcional, só para quem quiser aprofundar o personagem.
      </p>
      <div className="grid grid-cols-1 gap-4" onBlur={handleFieldBlur}>
        <Campo label="Rotina diária">
          <CampoTextarea name="rotina_diaria" defaultValue={character?.rotina_diaria} />
        </Campo>
        <Campo label="O que o deixa feliz">
          <CampoTextarea
            name="o_que_o_deixa_feliz"
            defaultValue={character?.o_que_o_deixa_feliz}
          />
        </Campo>
        <Campo label="Como se move" hint="Ex: elegante, desajeitado, confiante.">
          <CampoTexto name="como_se_move" defaultValue={character?.como_se_move} />
        </Campo>
        <Campo label="Maior desejo/objetivo">
          <CampoTextarea
            name="maior_desejo_objetivo"
            defaultValue={character?.maior_desejo_objetivo}
          />
        </Campo>
        <Campo label="Maior medo/insegurança">
          <CampoTextarea
            name="maior_medo_inseguranca"
            defaultValue={character?.maior_medo_inseguranca}
          />
        </Campo>
        <Campo label="Memória ou pensamento recorrente">
          <CampoTextarea
            name="memoria_recorrente"
            defaultValue={character?.memoria_recorrente}
          />
        </Campo>
        <Campo label="Talento mundano" hint="Ex: cozinhar, cantar, desenhar.">
          <CampoTexto name="talento_mundano" defaultValue={character?.talento_mundano} />
        </Campo>
        <Campo label="Comportamento sob pressão">
          <CampoTextarea
            name="comportamento_sob_pressao"
            defaultValue={character?.comportamento_sob_pressao}
          />
        </Campo>
        <Campo label="Primeira interação com o paranormal">
          <CampoTextarea
            name="primeira_interacao_paranormal"
            defaultValue={character?.primeira_interacao_paranormal}
          />
        </Campo>
        <CampoGrupo
          valorSelecionado={grupoSelecionado}
          onChangeSelecionado={setGrupoSelecionado}
          valorPedidoOutro={grupoPedidoOutro}
          onChangePedidoOutro={setGrupoPedidoOutro}
          onBlurCampo={handleFieldBlur}
        />
        <Campo label="Lore adicional do personagem">
          <CampoTextarea
            name="lore_adicional"
            defaultValue={character?.lore_adicional}
            rows={5}
          />
        </Campo>
        <Campo
          label="Mídia inspirada (texto/links)"
          hint="Referências soltas: links de Pinterest, atores/personagens parecidos, playlists, etc. Para imagens, usa a galeria abaixo (só disponível depois de guardares a ficha)."
        >
          <CampoTextarea
            name="midia_inspirada_texto"
            defaultValue={character?.midia_inspirada_texto}
            rows={4}
          />
        </Campo>
      </div>

      {isEdicao && character && (
        <div>
          <MidiaInspirada
            characterId={character.id}
            itens={midiaInspiradaItens}
            podeEditar={podeEditar}
          />
        </div>
      )}

      {isEdicao && character && (
        <div>
          <GaleriaArte
            characterId={character.id}
            itens={arteItens}
            podeEditar={podeEditar}
          />
        </div>
      )}

      <h2 className="text-lg font-medium">Atributos e classes</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" onBlur={handleFieldBlur}>
        <Campo label="Classe principal">
          <CampoSelect
            name="classe_principal"
            defaultValue={character?.classe_principal}
            options={CLASSE_OPCOES}
          />
        </Campo>
        <Campo label="Nível de domínio (principal)">
          <CampoSelect
            name="classe_principal_nivel"
            defaultValue={
              character?.classe_principal_nivel
                ? String(character.classe_principal_nivel)
                : undefined
            }
            options={nivelOpcoesLabeled}
            onChange={(v) => setClassePrincipalNivel(v ? Number(v) : 1)}
          />
        </Campo>
        <Campo label="Classe secundária">
          <CampoSelect
            name="classe_secundaria"
            defaultValue={character?.classe_secundaria}
            options={CLASSE_OPCOES}
          />
        </Campo>
        <Campo label="Nível de domínio (secundária)">
          <CampoSelect
            name="classe_secundaria_nivel"
            defaultValue={
              character?.classe_secundaria_nivel
                ? String(character.classe_secundaria_nivel)
                : undefined
            }
            options={nivelOpcoesLabeled}
            onChange={(v) => setClasseSecundariaNivel(v ? Number(v) : 1)}
          />
        </Campo>
      </div>

      <p className="text-sm text-neutral-500">
        O total de pontos de atributo sugerido abaixo ajusta-se
        automaticamente ao maior nível de domínio entre as duas classes.
      </p>
      <AtributosEditor
        valores={atributos}
        onChange={handleAtributoChange}
        onCommit={handleFieldBlur}
        nivel={nivelDominio}
      />

      {isEdicao && character && (
        <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-4">
          <h3 className="text-sm font-medium text-neutral-300">
            Stats calculados automaticamente
          </h3>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-neutral-500">HP</div>
              <div className="text-lg font-semibold">{character.hp_total}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Sanidade</div>
              <div className="text-lg font-semibold">{character.sanidade}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Movimento</div>
              <div className="text-lg font-semibold">{character.movimento}</div>
            </div>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            HP = 1d6 + 8 + CON, Sanidade = 10 − INT, Movimento = 1 + (DES / 2).
            Recalculado automaticamente ao guardar.
          </p>
        </div>
      )}

      <h2 className="text-lg font-medium">Combate / gameplay</h2>
      <div onBlur={handleFieldBlur}>
        <Campo
          label="Conexão com elemento paranormal"
          hint="Como o teu personagem (não a arma) interage com o paranormal, ex: Magia/Energia, Tecnologia, Onirismo. Se não tiveres a certeza, é melhor deixares a história decidir ou escolheres Nenhum."
        >
          <CampoSelect
            name="elemento_paranormal"
            defaultValue={character?.elemento_paranormal}
            options={ELEMENTO_OPCOES}
            onChange={setElemento}
          />
        </Campo>
        {elemento === "outro" && (
          <div className="mt-4">
            <Campo label="Elemento (outro)">
              <CampoTexto
                name="elemento_paranormal_outro"
                defaultValue={character?.elemento_paranormal_outro}
              />
            </Campo>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" onBlur={handleFieldBlur}>
        <Campo label="Arma" hint="Opcional, texto livre.">
          <CampoTexto name="arma" defaultValue={character?.arma} />
        </Campo>
      </div>
      <div className="grid grid-cols-1 gap-4" onBlur={handleFieldBlur}>
        <Campo label="Habilidade 1">
          <CampoTextarea name="habilidade_1" defaultValue={character?.habilidade_1} />
        </Campo>
        <Campo label="Habilidade 2">
          <CampoTextarea name="habilidade_2" defaultValue={character?.habilidade_2} />
        </Campo>
      </div>

      <h2 className="text-lg font-medium">Campanha e visibilidade</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" onBlur={handleFieldBlur}>
        <Campo label="Campanha/oneshot">
          <CampoTexto name="campanha" defaultValue={character?.campanha} />
        </Campo>
        <Campo
          label="Visibilidade"
          hint="Privada: só tu e o CRIADOR veem esta ficha, seja qual for o estado."
        >
          <select
            name="visibilidade"
            defaultValue={character?.visibilidade ?? "publica"}
            onChange={handleFieldBlur}
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          >
            <option value="publica">Pública</option>
            <option value="privada">Privada</option>
          </select>
        </Campo>
      </div>

      {!isEdicao && (
        <div>
          <SubmitButton
            pendingLabel="A criar ficha…"
            className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-60"
          >
            {isPending ? "A criar ficha…" : "Criar ficha"}
          </SubmitButton>
          {errorCriar && (
            <p role="alert" className="mt-2 text-sm text-red-400">
              {errorCriar}
            </p>
          )}
        </div>
      )}
    </form>
  );
}
