"use client";

import { useState } from "react";
import { ATRIBUTOS_KEYS } from "@/lib/characters/types";

const ATRIBUTO_LABELS: Record<(typeof ATRIBUTOS_KEYS)[number], string> = {
  atributo_for: "Força",
  atributo_int: "Inteligência",
  atributo_des: "Destreza",
  atributo_car: "Carisma/Provocação",
  atributo_con: "Constituição",
  atributo_sp: "Sintonia Paranormal",
};

const ATRIBUTO_SIGLAS: Record<(typeof ATRIBUTOS_KEYS)[number], string> = {
  atributo_for: "FOR",
  atributo_int: "INT",
  atributo_des: "DES",
  atributo_car: "CAR/PVC",
  atributo_con: "CON",
  atributo_sp: "SP",
};

const HISTORICO_MAXIMO = 10;

type Rolagem = {
  id: string;
  atributoKey: (typeof ATRIBUTOS_KEYS)[number];
  comVantagem: boolean;
  dados: number[]; // 1 valor sem vantagem, 2 valores com vantagem
  dadoUsado: number;
  bonusAtributo: number;
  total: number;
  natural: "critico" | "falha" | null; // baseado no dadoUsado
};

function rolarD20(): number {
  return 1 + Math.floor(Math.random() * 20);
}

function corDeNatural(natural: Rolagem["natural"]): string {
  if (natural === "critico") return "text-emerald-400";
  if (natural === "falha") return "text-red-400";
  return "text-neutral-100";
}

export function RoladorDados({
  atributos,
}: {
  atributos: Record<(typeof ATRIBUTOS_KEYS)[number], number>;
}) {
  const [comVantagem, setComVantagem] = useState(false);
  const [historico, setHistorico] = useState<Rolagem[]>([]);

  function rolar(atributoKey: (typeof ATRIBUTOS_KEYS)[number]) {
    const bonusAtributo = atributos[atributoKey];
    const primeiro = rolarD20();
    const dados = comVantagem ? [primeiro, rolarD20()] : [primeiro];
    const dadoUsado = Math.max(...dados);
    const total = dadoUsado + bonusAtributo;

    const natural: Rolagem["natural"] =
      dadoUsado === 20 ? "critico" : dadoUsado === 1 ? "falha" : null;

    const nova: Rolagem = {
      id: `${Date.now()}-${Math.random()}`,
      atributoKey,
      comVantagem,
      dados,
      dadoUsado,
      bonusAtributo,
      total,
      natural,
    };

    setHistorico((prev) => [nova, ...prev].slice(0, HISTORICO_MAXIMO));
  }

  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-300">Rolador de dados</h3>
        <label className="flex items-center gap-2 text-xs text-neutral-400">
          <input
            type="checkbox"
            checked={comVantagem}
            onChange={(e) => setComVantagem(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-neutral-700 bg-neutral-900"
          />
          Vantagem (2d20, usa o melhor)
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ATRIBUTOS_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => rolar(key)}
            className="rounded-md border border-neutral-700 px-3 py-2 text-left text-sm hover:bg-neutral-900"
          >
            <div className="font-medium text-neutral-200">
              {ATRIBUTO_SIGLAS[key]}
            </div>
            <div className="text-xs text-neutral-500">
              Teste de {ATRIBUTO_LABELS[key]} (+{atributos[key]})
            </div>
          </button>
        ))}
      </div>

      {historico.length > 0 && (
        <div className="mt-4 border-t border-neutral-800 pt-3">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Últimas rolagens
          </h4>
          <ul className="space-y-1.5">
            {historico.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="text-neutral-400">
                  <span className="text-neutral-300">
                    {ATRIBUTO_SIGLAS[r.atributoKey]}
                  </span>{" "}
                  {r.comVantagem
                    ? `(${r.dados.join(" / ")}, melhor ${r.dadoUsado})`
                    : `(${r.dadoUsado})`}{" "}
                  + {r.bonusAtributo}
                  {r.natural === "critico" && (
                    <span className="ml-1 text-emerald-400">— crítico natural!</span>
                  )}
                  {r.natural === "falha" && (
                    <span className="ml-1 text-red-400">— falha crítica!</span>
                  )}
                </span>
                <span className={`font-semibold tabular-nums ${corDeNatural(r.natural)}`}>
                  = {r.total}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-neutral-600">
            Histórico só desta sessão do browser — não é guardado.
          </p>
        </div>
      )}
    </div>
  );
}
