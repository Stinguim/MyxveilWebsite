"use client";

import { useState } from "react";
import { criarRelacao, criarGrupo } from "@/lib/relations/actions";
import { TIPO_RELACAO_OPCOES, type TipoRelacao } from "@/lib/relations/types";
import type { PersonagemDoGrafo } from "@/components/mapa/grafo-relacoes";
import type { Group } from "@/lib/relations/types";

type Props = {
  personagens: PersonagemDoGrafo[];
  grupos: Group[];
  onCriada: () => void;
};

export function FormNovaRelacao({ personagens, grupos, onCriada }: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const [aEnviar, setAEnviar] = useState(false);

  const [characterAId, setCharacterAId] = useState("");
  const [alvoTipo, setAlvoTipo] = useState<"personagem" | "grupo">("personagem");
  const [alvoId, setAlvoId] = useState("");
  const [tipo, setTipo] = useState<TipoRelacao>("aliado");
  const [tipoOutro, setTipoOutro] = useState("");
  const [descricao, setDescricao] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!characterAId || !alvoId) {
      setErro("Escolhe as duas pontas da ligação.");
      return;
    }

    setAEnviar(true);
    const resultado = await criarRelacao({
      characterAId,
      characterBId: alvoTipo === "personagem" ? alvoId : undefined,
      groupBId: alvoTipo === "grupo" ? alvoId : undefined,
      tipo,
      tipoOutro,
      descricao,
    });
    setAEnviar(false);

    if ("error" in resultado) {
      setErro(resultado.error);
      return;
    }

    setCharacterAId("");
    setAlvoId("");
    setDescricao("");
    setTipoOutro("");
    onCriada();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-md border border-neutral-800 p-4">
      <h3 className="text-sm font-medium text-neutral-300">Nova ligação</h3>

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-neutral-500">Personagem</label>
          <select
            value={characterAId}
            onChange={(e) => setCharacterAId(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm"
          >
            <option value="">— Seleciona —</option>
            {personagens.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-neutral-500">Tipo de relação</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoRelacao)}
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm"
          >
            {TIPO_RELACAO_OPCOES.map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-neutral-500">Ligar a</label>
          <div className="mt-1 flex gap-2">
            <select
              value={alvoTipo}
              onChange={(e) => {
                setAlvoTipo(e.target.value as "personagem" | "grupo");
                setAlvoId("");
              }}
              className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm"
            >
              <option value="personagem">Personagem</option>
              <option value="grupo">Grupo</option>
            </select>
            <select
              value={alvoId}
              onChange={(e) => setAlvoId(e.target.value)}
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm"
            >
              <option value="">— Seleciona —</option>

              {alvoTipo === "personagem"
                ? personagens.map((personagem) => (
                    <option key={personagem.id} value={personagem.id}>
                      {personagem.nome}
                    </option>
                  ))
                : grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nome}
                    </option>
                  ))}
            </select>
          </div>
        </div>

        {tipo === "outro" && (
          <div>
            <label className="block text-xs text-neutral-500">Descreve o tipo</label>
            <input
              type="text"
              value={tipoOutro}
              onChange={(e) => setTipoOutro(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs text-neutral-500">Notas (opcional)</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={aEnviar}
        className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-60"
      >
        {aEnviar ? "A criar…" : "Criar ligação"}
      </button>
    </form>
  );
}

export function FormNovoGrupo({ onCriado }: { onCriado: () => void }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aEnviar, setAEnviar] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAEnviar(true);
    const resultado = await criarGrupo(nome, descricao);
    setAEnviar(false);

    if ("error" in resultado) {
      setErro(resultado.error);
      return;
    }
    setNome("");
    setDescricao("");
    onCriado();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-md border border-neutral-800 p-4">
      <h3 className="text-sm font-medium text-neutral-300">Novo grupo/facção</h3>
      {erro && <p className="text-sm text-red-400">{erro}</p>}
      <div>
        <label className="block text-xs text-neutral-500">Nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Descrição</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={aEnviar}
        className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900 disabled:opacity-60"
      >
        {aEnviar ? "A criar…" : "Criar grupo"}
      </button>
    </form>
  );
}
