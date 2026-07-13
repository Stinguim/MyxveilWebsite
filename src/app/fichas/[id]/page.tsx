import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import type { Character, MidiaInspirada } from "@/lib/characters/types";
import { urlRetrato } from "@/lib/characters/retrato-url";
import { comUrlsMidiaInspirada } from "@/lib/characters/midia-inspirada-url";
import { FormFicha } from "@/components/characters/form-ficha";
import { AcoesFicha } from "@/components/characters/acoes-ficha";
import { ToggleVisibilidade } from "@/components/characters/toggle-visibilidade";
import { ESTADO_LABELS } from "@/lib/characters/types";

export default async function FichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const current = await getCurrentUser();

  if (!current) {
    redirect(`/login?next=/fichas/${id}`);
  }

  const supabase = await createClient();
  const { data: character, error } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .maybeSingle<Character>();

  // .maybeSingle() (em vez de .single()) porque zero linhas é um
  // resultado legítimo aqui: acontece sempre que a RLS bloqueia o acesso
  // (ficha privada de outro jogador, ou id inexistente). .single()
  // trataria isso como um erro de query (PGRST116) em vez de "não
  // encontrado".
  if (error || !character) {
    notFound();
  }

  const isDono = character.owner_id === current.user.id;
  const isCriador = current.profile.role === "criador";
  const podeEditar = isDono || isCriador;

  const { data: midiaInspiradaData } = await supabase
    .from("character_midia_inspirada")
    .select("*")
    .eq("character_id", character.id)
    .order("ordem", { ascending: true });

  const [retratoUrl, midiaInspiradaItens] = await Promise.all([
    urlRetrato(character.retrato_path),
    comUrlsMidiaInspirada((midiaInspiradaData ?? []) as MidiaInspirada[]),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/fichas" className="text-sm text-neutral-400 hover:text-white">
            ← Voltar às fichas
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{character.nome}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400">
            {ESTADO_LABELS[character.estado]}
          </span>
          {isDono && (
            <ToggleVisibilidade
              characterId={character.id}
              visibilidade={character.visibilidade}
            />
          )}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <AcoesFicha character={character} isDono={isDono} isCriador={isCriador} />
        {podeEditar && (
          <Link
            href={`/fichas/${id}/jogar`}
            className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-white"
          >
            Abrir ficha jogável →
          </Link>
        )}
      </div>

      <FormFicha
        character={character}
        podeEditar={podeEditar}
        retratoUrl={retratoUrl}
        midiaInspiradaItens={midiaInspiradaItens}
      />
    </main>
  );
}
