"use client";

import { ATRIBUTOS_KEYS, TOTAL_PONTOS_POR_NIVEL } from "@/lib/characters/types";

const ATRIBUTO_LABELS: Record<(typeof ATRIBUTOS_KEYS)[number], string> = {
  atributo_for: "Físico/Força (FOR)",
  atributo_int: "Inteligência (INT)",
  atributo_des: "Destreza (DES)",
  atributo_car: "Carisma/Provocação (CAR/PVC)",
  atributo_con: "Constituição (CON)",
  atributo_sp: "Sintonia Paranormal (SP)",
};

type Props = {
  valores: Record<(typeof ATRIBUTOS_KEYS)[number], number>;
  onChange: (key: (typeof ATRIBUTOS_KEYS)[number], value: number) => void;
  /**
   * Chamado quando o utilizador larga o slider (mouseup/touchend/teclado),
   * não a cada pixel arrastado. É este o momento certo para disparar o
   * auto-save — disparar a cada `onChange` faria o debounce reiniciar
   * dezenas de vezes por segundo durante o arrasto, e um router.refresh()
   * a meio de um drag pode interromper o próprio gesto do rato/touch,
   * dando a sensação de o slider "bloquear".
   */
  onCommit?: () => void;
  /** Nível de domínio mais alto entre classe principal e secundária. */
  nivel: number;
};

export function AtributosEditor({ valores, onChange, onCommit, nivel }: Props) {
  const total = ATRIBUTOS_KEYS.reduce((acc, k) => acc + valores[k], 0);
  const totalSugerido = TOTAL_PONTOS_POR_NIVEL[nivel] ?? TOTAL_PONTOS_POR_NIVEL[1];
  const excedeu = total > totalSugerido;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-300">Atributos</h3>
        <span
          className={
            excedeu
              ? "text-sm font-medium text-amber-400"
              : "text-sm text-neutral-400"
          }
        >
          {total}/{totalSugerido} pontos usados (nível {nivel})
        </span>
      </div>

      {excedeu && (
        <p className="mb-3 rounded-md border border-amber-800 bg-amber-950/50 px-3 py-2 text-xs text-amber-300">
          Ultrapassaste o total sugerido de {totalSugerido} pontos para nível{" "}
          {nivel}. Continua permitido, pode fazer sentido para personagens de
          nível mais alto, mas confirma com o Dungeon Master se for uma ficha
          inicial.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ATRIBUTOS_KEYS.map((key) => (
          <div key={key}>
            <label className="block text-xs text-neutral-400">
              {ATRIBUTO_LABELS[key]}
            </label>
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              name={key}
              value={valores[key]}
              onChange={(e) => onChange(key, Number(e.target.value))}
              onMouseUp={onCommit}
              onTouchEnd={onCommit}
              onKeyUp={onCommit}
              className="mt-1 w-full accent-neutral-100"
            />
            <div className="text-right text-sm tabular-nums text-neutral-300">
              {valores[key]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
