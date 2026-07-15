import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { urlRetrato } from "@/lib/characters/retrato-url";
import type { Character } from "@/lib/characters/types";
import type { Recurso } from "@/lib/characters/sessao-actions";
import {
  CLASSE_LABELS,
  ELEMENTO_PARANORMAL_LABELS,
  ESPECIE_LABELS,
  GENERO_LABELS,
  NIVEL_DOMINIO_LABELS,
  ORIGEM_LABELS,
} from "@/lib/characters/types";
import { RetratoPersonagem } from "@/components/characters/retrato-personagem";
import { UploadRetrato } from "@/components/characters/upload-retrato";
import { ModoSessao } from "@/components/characters/modo-sessao";
import { RoladorDados } from "@/components/characters/rolador-dados";

function outroOu<T extends string>(
  labels: Record<T, string>,
  valor: T | null,
  outro: string | null
): string | null {
  if (!valor) return null;
  if (valor === "outro") return outro || "Outro";
  return labels[valor];
}

function Atributo({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-neutral-800 bg-neutral-900/60 py-3">
      <span className="text-2xl font-bold">{valor}</span>
      <span className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </span>
    </div>
  );
}

export default async function FichaJogarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const current = await getCurrentUser();

  if (!current) {
    redirect(`/login?next=/fichas/${id}/jogar`);
  }

  const supabase = await createClient();
  const { data: character, error } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .maybeSingle<Character>();

  if (error || !character) {
    notFound();
  }

  const isDono = character.owner_id === current.user.id;
  const isCriador = current.profile.role === "criador";

  // Ficha jogável é só para dono/CRIADOR, o resto vê o preview em
  // /fichas/[id] (secção 3 da spec: jogadores só editam/"jogam" as suas
  // próprias fichas).
  if (!isDono && !isCriador) {
    redirect(`/fichas/${id}`);
  }

  const buscarGrupoNome = character.group_id
    ? supabase
        .from("groups")
        .select("nome")
        .eq("id", character.group_id)
        .maybeSingle()
    : Promise.resolve({ data: null });

  const [{ data: recursos }, retratoUrl, grupoData] = await Promise.all([
    supabase
      .from("character_recursos")
      .select("*")
      .eq("character_id", character.id)
      .order("ordem", { ascending: true }),
    urlRetrato(character.retrato_path),
    buscarGrupoNome,
  ]);
  const grupoNome = grupoData?.data?.nome ?? null;

  const classePrincipalLabel = character.classe_principal
    ? `${CLASSE_LABELS[character.classe_principal]} · ${
        NIVEL_DOMINIO_LABELS[character.classe_principal_nivel ?? 1]
      }`
    : null;
  const classeSecundariaLabel = character.classe_secundaria
    ? `${CLASSE_LABELS[character.classe_secundaria]} · ${
        NIVEL_DOMINIO_LABELS[character.classe_secundaria_nivel ?? 1]
      }`
    : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/fichas/${id}`} className="text-sm text-neutral-400 hover:text-white">
          ← Editar ficha
        </Link>
        <span className="text-xs text-neutral-600">Modo jogável</span>
      </div>

      {/* Cabeçalho: retrato + identidade */}
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {isDono || isCriador ? (
          <UploadRetrato characterId={character.id} nome={character.nome} urlAtual={retratoUrl} />
        ) : (
          <RetratoPersonagem url={retratoUrl} nome={character.nome} size="lg" />
        )}

        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold">{character.nome}</h1>
          <p className="mt-1 text-neutral-400">
            {[
              outroOu(GENERO_LABELS, character.genero, character.genero_outro),
              outroOu(ESPECIE_LABELS, character.especie, character.especie_outro),
              outroOu(ORIGEM_LABELS, character.origem, character.origem_outro),
              character.altura,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            {classePrincipalLabel && (
              <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-200">
                {classePrincipalLabel}
              </span>
            )}
            {classeSecundariaLabel && (
              <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-200">
                {classeSecundariaLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modo sessão: HP/Sanidade/recursos, já existente, reaproveitado aqui */}
      <div className="mb-8">
        <ModoSessao
          character={character}
          recursos={(recursos ?? []) as Recurso[]}
          podeEditar={isDono || isCriador}
        />
      </div>

      {/* Rolador de dados: testes de atributo com d20 (+ vantagem opcional) */}
      <div className="mb-8">
        <RoladorDados
          atributos={{
            atributo_for: character.atributo_for,
            atributo_int: character.atributo_int,
            atributo_des: character.atributo_des,
            atributo_car: character.atributo_car,
            atributo_con: character.atributo_con,
            atributo_sp: character.atributo_sp,
          }}
        />
      </div>

      {/* Atributos em destaque */}
      <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
        <Atributo label="FOR" valor={character.atributo_for} />
        <Atributo label="INT" valor={character.atributo_int} />
        <Atributo label="DES" valor={character.atributo_des} />
        <Atributo label="CAR/PVC" valor={character.atributo_car} />
        <Atributo label="CON" valor={character.atributo_con} />
        <Atributo label="SP" valor={character.atributo_sp} />
      </div>

      {/* Combate/gameplay */}
      <div className="mb-8 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Combate
        </h2>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {character.arma && (
            <div>
              <div className="text-xs text-neutral-500">Arma</div>
              <div>{character.arma}</div>
            </div>
          )}
          {character.elemento_paranormal && (
            <div>
              <div className="text-xs text-neutral-500">Elemento paranormal</div>
              <div>
                {outroOu(
                  ELEMENTO_PARANORMAL_LABELS,
                  character.elemento_paranormal,
                  character.elemento_paranormal_outro
                )}
              </div>
            </div>
          )}
        </div>
        {(character.habilidade_1 || character.habilidade_2) && (
          <div className="mt-3 space-y-2 border-t border-neutral-800 pt-3">
            {character.habilidade_1 && (
              <div>
                <div className="text-xs text-neutral-500">Habilidade 1</div>
                <div className="whitespace-pre-wrap text-sm">{character.habilidade_1}</div>
              </div>
            )}
            {character.habilidade_2 && (
              <div>
                <div className="text-xs text-neutral-500">Habilidade 2</div>
                <div className="whitespace-pre-wrap text-sm">{character.habilidade_2}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Roleplay / lore, colapsado visualmente em texto corrido */}
      {(character.aparencia || character.lore_adicional || grupoNome || character.grupo_pedido_outro) && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
            Roleplay
          </h2>
          {(grupoNome || character.grupo_pedido_outro) && (
            <p className="mb-2 text-sm">
              <span className="text-neutral-500">Grupo: </span>
              {grupoNome ?? `${character.grupo_pedido_outro} (pedido pendente)`}
            </p>
          )}
          {character.aparencia && (
            <p className="mb-2 whitespace-pre-wrap text-sm text-neutral-300">
              {character.aparencia}
            </p>
          )}
          {character.lore_adicional && (
            <p className="whitespace-pre-wrap text-sm text-neutral-300">
              {character.lore_adicional}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
