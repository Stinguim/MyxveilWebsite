"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { alternarVisibilidade } from "@/lib/characters/actions";
import type { VisibilidadeFicha } from "@/lib/characters/types";

export function ToggleVisibilidade({
  characterId,
  visibilidade,
}: {
  characterId: string;
  visibilidade: VisibilidadeFicha;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggle() {
    const nova: VisibilidadeFicha =
      visibilidade === "publica" ? "privada" : "publica";
    setError(null);
    startTransition(async () => {
      const result = await alternarVisibilidade(characterId, nova);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={toggle}
        className="flex items-center gap-2 rounded-full border border-neutral-700 px-3 py-1 text-xs hover:bg-neutral-900 disabled:opacity-60"
        title="Só tu e o CRIADOR veem a ficha enquanto estiver privada"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            visibilidade === "publica" ? "bg-emerald-400" : "bg-amber-400"
          }`}
        />
        {visibilidade === "publica" ? "Pública" : "Privada"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
