import type { Character, CharacterWithOwner } from "@/lib/characters/types";
import {
  CLASSE_LABELS,
  ELEMENTO_PARANORMAL_LABELS,
  ESPECIE_LABELS,
  ESTADO_LABELS,
  GENERO_LABELS,
  GRUPO_LABELS,
  NIVEL_DOMINIO_LABELS,
  ORIGEM_LABELS,
} from "@/lib/characters/types";
import { RetratoPersonagem } from "@/components/characters/retrato-personagem";

function Linha({ label, value }: { label: string; value: ReactNodeLike }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="border-b border-neutral-800 py-2">
      <dt className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-neutral-200">
        {value}
      </dd>
    </div>
  );
}

type ReactNodeLike = string | number | null | undefined;

function outroOu<T extends string>(
  labels: Record<T, string>,
  valor: T | null,
  outro: string | null
) {
  if (!valor) return null;
  if (valor === "outro") return outro || "Outro";
  return labels[valor];
}

export function FichaPreview({
  character,
  retratoUrl,
}: {
  character: Character | CharacterWithOwner;
  /**
   * URL pública do retrato — passada pelo Server Component pai
   * (urlRetrato() faz I/O e não pode correr diretamente aqui, já que
   * este componente também é usado a partir do form-ficha.tsx, um
   * Client Component). undefined = não mostrar retrato (compatibilidade
   * com chamadas antigas que ainda não passam este prop).
   */
  retratoUrl?: string | null;
}) {
  const ownerLabel =
    "owner_nome_alcunha" in character
      ? character.owner_nome_alcunha ||
        character.owner_discord_username ||
        "Jogador"
      : null;

  return (
    <article className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-4">
          {retratoUrl !== undefined && (
            <RetratoPersonagem url={retratoUrl} nome={character.nome} size="md" />
          )}
          <div>
            <h2 className="text-2xl font-semibold">{character.nome}</h2>
            {ownerLabel && (
              <p className="text-sm text-neutral-500">Criado por {ownerLabel}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-neutral-400">
            {ESTADO_LABELS[character.estado]}
          </span>
          <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-neutral-400">
            {character.visibilidade === "privada" ? "Privada" : "Pública"}
          </span>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        <Linha label="Idade" value={character.idade} />
        <Linha
          label="Género"
          value={outroOu(GENERO_LABELS, character.genero, character.genero_outro)}
        />
        <Linha
          label="Espécie"
          value={outroOu(
            ESPECIE_LABELS,
            character.especie,
            character.especie_outro
          )}
        />
        <Linha
          label="Origem"
          value={outroOu(ORIGEM_LABELS, character.origem, character.origem_outro)}
        />
      </section>
      <Linha label="Aparência" value={character.aparencia} />

      <div className="mt-4 grid grid-cols-3 gap-3 rounded-md border border-neutral-800 bg-neutral-950 p-4 sm:grid-cols-3">
        <div className="text-center">
          <div className="text-xs text-neutral-500">HP</div>
          <div className="text-xl font-semibold">{character.hp_total}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-neutral-500">Sanidade</div>
          <div className="text-xl font-semibold">{character.sanidade}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-neutral-500">Movimento</div>
          <div className="text-xl font-semibold">{character.movimento}</div>
        </div>
      </div>

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Linha label="FOR" value={character.atributo_for} />
        <Linha label="INT" value={character.atributo_int} />
        <Linha label="DES" value={character.atributo_des} />
        <Linha label="CAR/PVC" value={character.atributo_car} />
        <Linha label="CON" value={character.atributo_con} />
        <Linha label="SP" value={character.atributo_sp} />
      </section>

      <section className="mt-2">
        <Linha
          label="Classe principal"
          value={
            character.classe_principal
              ? `${CLASSE_LABELS[character.classe_principal]} (${
                  NIVEL_DOMINIO_LABELS[character.classe_principal_nivel ?? 1]
                })`
              : null
          }
        />
        <Linha
          label="Classe secundária"
          value={
            character.classe_secundaria
              ? `${CLASSE_LABELS[character.classe_secundaria]} (${
                  NIVEL_DOMINIO_LABELS[character.classe_secundaria_nivel ?? 1]
                })`
              : null
          }
        />
      </section>

      <section className="mt-2">
        <Linha label="Arma" value={character.arma} />
        <Linha
          label="Conexão com elemento"
          value={outroOu(
            ELEMENTO_PARANORMAL_LABELS,
            character.elemento_paranormal,
            character.elemento_paranormal_outro
          )}
        />
        <Linha label="Habilidade 1" value={character.habilidade_1} />
        <Linha label="Habilidade 2" value={character.habilidade_2} />
      </section>

      <section className="mt-2">
        <Linha label="Rotina diária" value={character.rotina_diaria} />
        <Linha label="O que o deixa feliz" value={character.o_que_o_deixa_feliz} />
        <Linha label="Como se move" value={character.como_se_move} />
        <Linha
          label="Maior desejo/objetivo"
          value={character.maior_desejo_objetivo}
        />
        <Linha
          label="Maior medo/insegurança"
          value={character.maior_medo_inseguranca}
        />
        <Linha label="Memória recorrente" value={character.memoria_recorrente} />
        <Linha label="Talento mundano" value={character.talento_mundano} />
        <Linha
          label="Comportamento sob pressão"
          value={character.comportamento_sob_pressao}
        />
        <Linha
          label="Primeira interação com o paranormal"
          value={character.primeira_interacao_paranormal}
        />
        <Linha
          label="Grupo"
          value={outroOu(GRUPO_LABELS, character.grupo, character.grupo_outro)}
        />
        <Linha label="Lore adicional" value={character.lore_adicional} />
      </section>

      <section className="mt-2">
        <Linha label="Campanha/oneshot" value={character.campanha} />
      </section>
    </article>
  );
}
