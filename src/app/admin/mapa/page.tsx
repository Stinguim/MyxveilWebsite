"use client";

import { useCallback, useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GrafoRelacoes, type PersonagemDoGrafo } from "@/components/mapa/grafo-relacoes";
import { FormNovaRelacao, FormNovoGrupo } from "@/components/mapa/formularios-mapa";
import { apagarRelacao } from "@/lib/relations/actions";
import { TIPO_RELACAO_LABEL, type CharacterRelation, type Group } from "@/lib/relations/types";

/**
 * Verificação de "és CRIADOR" acontece no cliente (via RLS + role no
 * perfil já carregado noutro sítio) porque esta página é toda ela
 * interativa (grafo + formulários). A RLS de escrita em
 * character_relations/groups ("*_write_criador_only") é a barreira real
 * — mesmo que alguém abra /admin/mapa manualmente sem ser CRIADOR, os
 * botões de criar/apagar vão falhar com "não tens permissão" em vez de
 * alterar dados.
 */
export default function AdminMapaPage() {
  const [personagens, setPersonagens] = useState<PersonagemDoGrafo[]>([]);
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [relacoes, setRelacoes] = useState<CharacterRelation[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [relacaoSelecionada, setRelacaoSelecionada] = useState<CharacterRelation | null>(
    null
  );
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login?next=/admin/mapa");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "criador") {
      redirect("/mapa");
    }

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
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function onApagarRelacaoSelecionada() {
    if (!relacaoSelecionada) return;
    const resultado = await apagarRelacao(relacaoSelecionada.id);
    if (resultado.error) {
      setErro(resultado.error);
      return;
    }
    setRelacaoSelecionada(null);
    void carregar();
  }

  if (carregando) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <p className="text-sm text-neutral-500">A carregar…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Gestão do mapa de relações</h1>

      {erro && <p className="mb-4 text-sm text-red-400">{erro}</p>}

      <div className="mb-6">
        <GrafoRelacoes
          personagens={personagens}
          grupos={grupos}
          relacoes={relacoes}
          onClickAresta={(relacao) => setRelacaoSelecionada(relacao)}
        />
      </div>

      {relacaoSelecionada && (
        <div className="mb-6 flex items-center justify-between rounded-md border border-amber-900 bg-amber-950/30 p-4">
          <div className="text-sm">
            <span className="font-medium">
              {TIPO_RELACAO_LABEL[relacaoSelecionada.tipo]}
            </span>
            {relacaoSelecionada.descricao && (
              <span className="text-neutral-400"> — {relacaoSelecionada.descricao}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onApagarRelacaoSelecionada}
              className="rounded-md border border-red-800 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950/50"
            >
              Apagar ligação
            </button>
            <button
              onClick={() => setRelacaoSelecionada(null)}
              className="text-sm text-neutral-500 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormNovaRelacao
          personagens={personagens}
          grupos={grupos}
          onCriada={() => void carregar()}
        />
        <FormNovoGrupo onCriado={() => void carregar()} />
      </div>
    </main>
  );
}
