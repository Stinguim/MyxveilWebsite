"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Character } from "@/lib/characters/types";
import {
  atualizarRecursosSessao,
  criarRecurso,
  atualizarRecurso,
  apagarRecurso,
  type Recurso,
} from "@/lib/characters/sessao-actions";

type Props = {
  character: Character;
  recursos: Recurso[];
  /** true = utilizador atual pode editar (dono ou CRIADOR). */
  podeEditar: boolean;
};

function Barra({
  label,
  atual,
  maximo,
  onAlterar,
  disabled,
}: {
  label: string;
  atual: number;
  maximo: number;
  onAlterar: (novoValor: number) => void;
  disabled: boolean;
}) {
  const percentagem = maximo > 0 ? Math.min(100, Math.max(0, (atual / maximo) * 100)) : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-300">{label}</span>
        <span className="font-medium">
          {atual} / {maximo}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full bg-neutral-100 transition-all"
          style={{ width: `${percentagem}%` }}
        />
      </div>
      {!disabled && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAlterar(atual - 1)}
            className="h-7 w-7 rounded-md border border-neutral-700 text-sm hover:bg-neutral-900"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => onAlterar(atual + 1)}
            className="h-7 w-7 rounded-md border border-neutral-700 text-sm hover:bg-neutral-900"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => onAlterar(maximo)}
            className="ml-2 text-xs text-neutral-500 hover:text-white"
          >
            repor máximo
          </button>
        </div>
      )}
    </div>
  );
}

export function ModoSessao({ character, recursos, podeEditar }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [hpAtual, setHpAtual] = useState(character.hp_atual);
  const [sanidadeAtual, setSanidadeAtual] = useState(character.sanidade_atual);
  const [novoRecursoNome, setNovoRecursoNome] = useState("");
  const [novoRecursoMax, setNovoRecursoMax] = useState(0);

  function alterarHp(novoValor: number) {
    setHpAtual(novoValor);
    setErro(null);
    startTransition(async () => {
      const resultado = await atualizarRecursosSessao(character.id, {
        hp_atual: novoValor,
      });
      if ("error" in resultado) {
        setErro(resultado.error);
        setHpAtual(character.hp_atual); // reverte otimismo
      } else {
        router.refresh();
      }
    });
  }

  function alterarSanidade(novoValor: number) {
    setSanidadeAtual(novoValor);
    setErro(null);
    startTransition(async () => {
      const resultado = await atualizarRecursosSessao(character.id, {
        sanidade_atual: novoValor,
      });
      if ("error" in resultado) {
        setErro(resultado.error);
        setSanidadeAtual(character.sanidade_atual);
      } else {
        router.refresh();
      }
    });
  }

  function alterarRecurso(recurso: Recurso, novoValor: number) {
    startTransition(async () => {
      const resultado = await atualizarRecurso(recurso.id, character.id, {
        valor_atual: novoValor,
      });
      if ("error" in resultado) {
        setErro(resultado.error);
      } else {
        router.refresh();
      }
    });
  }

  function onCriarRecurso() {
    if (!novoRecursoNome.trim()) return;
    startTransition(async () => {
      const resultado = await criarRecurso(
        character.id,
        novoRecursoNome,
        novoRecursoMax
      );
      if ("error" in resultado) {
        setErro(resultado.error);
      } else {
        setNovoRecursoNome("");
        setNovoRecursoMax(0);
        router.refresh();
      }
    });
  }

  function onApagarRecurso(recurso: Recurso) {
    if (!confirm(`Remover o recurso "${recurso.nome}"?`)) return;
    startTransition(async () => {
      const resultado = await apagarRecurso(recurso.id, character.id);
      if (resultado.error) {
        setErro(resultado.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-300">Modo sessão</h3>
        {isPending && <span className="text-xs text-neutral-500">a guardar…</span>}
      </div>

      {erro && (
        <p role="alert" className="mb-3 text-sm text-red-400">
          {erro}
        </p>
      )}

      <div className="space-y-4">
        <Barra
          label="HP"
          atual={hpAtual}
          maximo={character.hp_total}
          onAlterar={alterarHp}
          disabled={!podeEditar}
        />
        <Barra
          label="Sanidade"
          atual={sanidadeAtual}
          maximo={character.sanidade}
          onAlterar={alterarSanidade}
          disabled={!podeEditar}
        />

        {recursos.map((recurso) => (
          <div key={recurso.id} className="flex items-center gap-2">
            <div className="flex-1">
              <Barra
                label={recurso.nome}
                atual={recurso.valor_atual}
                maximo={recurso.valor_maximo}
                onAlterar={(v) => alterarRecurso(recurso, v)}
                disabled={!podeEditar}
              />
            </div>
            {podeEditar && (
              <button
                type="button"
                onClick={() => onApagarRecurso(recurso)}
                className="mt-5 text-xs text-neutral-500 hover:text-red-400"
              >
                remover
              </button>
            )}
          </div>
        ))}
      </div>

      {podeEditar && (
        <div className="mt-5 flex items-end gap-2 border-t border-neutral-800 pt-4">
          <div className="flex-1">
            <label className="block text-xs text-neutral-500">
              Novo recurso (ex: Munição)
            </label>
            <input
              type="text"
              value={novoRecursoNome}
              onChange={(e) => setNovoRecursoNome(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm outline-none focus:border-neutral-400"
            />
          </div>
          <div className="w-20">
            <label className="block text-xs text-neutral-500">Máximo</label>
            <input
              type="number"
              min={0}
              value={novoRecursoMax}
              onChange={(e) => setNovoRecursoMax(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm outline-none focus:border-neutral-400"
            />
          </div>
          <button
            type="button"
            onClick={onCriarRecurso}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
          >
            Adicionar
          </button>
        </div>
      )}
    </div>
  );
}
