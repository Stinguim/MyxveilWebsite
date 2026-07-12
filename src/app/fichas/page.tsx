import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import type { CharacterWithOwner } from "@/lib/characters/types";
import { FiltrosFichas } from "@/components/characters/filtros-fichas";
import { FichaCard } from "@/components/characters/ficha-card";

type SearchParams = {
  q?: string;
  estado?: string;
  dono?: string;
};

/**
 * O operador .or() do PostgREST usa vírgulas para separar condições e
 * parênteses para agrupar — se o texto de pesquisa do utilizador contiver
 * esses caracteres (ou os coringas %/*  do próprio ilike), a query parte-se
 * com erro 400 ou muda de significado. Escapamos removendo/neutralizando
 * esses caracteres antes de montar a string do .or().
 */
function escaparTermoPesquisa(q: string): string {
  return q.replace(/[,()%*]/g, " ").trim();
}

const BUCKET_ARTE = "character-art";

export default async function FichasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/login?next=/fichas");
  }

  const { q, estado, dono } = await searchParams;

  const supabase = await createClient();
  let query = supabase
    .from("characters_with_owner")
    .select("*")
    .order("updated_at", { ascending: false });

  if (estado) {
    query = query.eq("estado", estado);
  }

  if (dono === "minhas") {
    query = query.eq("owner_id", current.user.id);
  }

  const termoSeguro = q ? escaparTermoPesquisa(q) : "";
  if (termoSeguro) {
    // Pesquisa por nome, campanha, ou nome/discord do dono.
    query = query.or(
      `nome.ilike.%${termoSeguro}%,campanha.ilike.%${termoSeguro}%,owner_nome_alcunha.ilike.%${termoSeguro}%,owner_discord_username.ilike.%${termoSeguro}%`
    );
  }

  const { data: characters } = await query.returns<CharacterWithOwner[]>();

  // URLs públicas dos retratos: o bucket é público, por isso
  // getPublicUrl() é só construção de string (sem I/O de rede), seguro
  // de fazer em massa aqui sem custo extra por ficha.
  const retratosPorId = new Map<string, string>();
  for (const c of characters ?? []) {
    if (c.retrato_path) {
      const { data } = supabase.storage.from(BUCKET_ARTE).getPublicUrl(c.retrato_path);
      retratosPorId.set(c.id, data.publicUrl);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Fichas</h1>
        <Link
          href="/fichas/nova"
          className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-white"
        >
          + Nova ficha
        </Link>
      </div>

      <Suspense>
        <FiltrosFichas />
      </Suspense>

      {characters && characters.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {characters.map((c) => (
            <FichaCard
              key={c.id}
              character={c}
              retratoUrl={retratosPorId.get(c.id) ?? null}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">
          Nenhuma ficha encontrada com estes filtros.
        </p>
      )}
    </main>
  );
}
