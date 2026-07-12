"use client";

import { useEffect, useRef } from "react";

/**
 * Chama `callback` com o valor mais recente `value`, mas só depois de
 * `delayMs` sem novas alterações. Usado pelo auto-save do formulário de
 * ficha, para não disparar uma escrita na BD a cada tecla premida.
 */
export function useDebouncedEffect(
  callback: () => void,
  deps: React.DependencyList,
  delayMs: number
) {
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Não corre no primeiro render (evita um auto-save imediato ao abrir
    // a página, antes de o utilizador ter mudado nada).
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const timeout = setTimeout(callback, delayMs);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
