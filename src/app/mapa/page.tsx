"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GrafoRelacoes, type PersonagemDoGrafo } from "@/components/mapa/grafo-relacoes";
import type { CharacterRelation, Group } from "@/lib/relations/types";

/**
 * Client Component: o grafo em si (react-flow) precisa de correr no
 * browser, e queremos abrir a ficha resumida ao clicar num nó sem sair da
 * página — por isso a leitura de dados também acontece aqui, via
 * @/lib/supabase/client, em vez de vir de um Server Component pai. A RLS
 * aplica-se da mesma forma independentemente do cliente usado.
 */
export default function MapaPage() {
  const router = useRouter();
  const [personagens, setPersonagens] = useState<PersonagemDoGrafo[]>([]);
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [relacoes, setRelacoes] = useState<CharacterRelation[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function carregar() {
      const [{ data: characters }, { data: gruposData }, { data: relacoesData }] =
        await Promise.all([
          supabase.from("characters").select("id, nome"),
          supabase.from("groups").select("*"),
          supabase.from("character_relations").select("*"),
        ]);

      setPersonagens((characters ?? []) as PersonagemDoGrafo[]);
      setGrupos((gruposData ?? []) as Group[]);
      setRelacoes((relacoesData ?? []) as CharacterRelation[]);
      setCarregando(false);
    }

    void carregar();
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Mapa de relações</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Clica numa personagem para abrir a ficha. As ligações são geridas
        pelo CRIADOR.
      </p>

      {carregando ? (
        <p className="text-sm text-neutral-500">A carregar mapa…</p>
      ) : (
        <GrafoRelacoes
          personagens={personagens}
          grupos={grupos}
          relacoes={relacoes}
          onClickPersonagem={(id) => router.push(`/fichas/${id}`)}
        />
      )}
    </main>
  );
}
