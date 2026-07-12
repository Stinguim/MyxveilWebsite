"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Character } from "@/lib/characters/types";
import {
  aprovarFicha,
  apagarFicha,
  arquivarFicha,
  duplicarFicha,
  submeterFicha,
  voltarParaRascunho,
} from "@/lib/characters/actions";

type Props = {
  character: Character;
  isDono: boolean;
  isCriador: boolean;
};

type MudarEstadoResult =
  | { error: string }
  | { success: true; character: Character };

export function AcoesFicha({ character, isDono, isCriador }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function run(action: () => Promise<MudarEstadoResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if ("error" in result) {
        setError(result.error);
      } else {
        // A Server Action já correu revalidatePath, mas este Client
        // Component recebeu `character` como prop no momento do render
        // do servidor-pai — sem router.refresh(), os botões (que
        // dependem de character.estado) e a caixa de stats calculados
        // continuariam a mostrar o estado antigo até a página ser
        // recarregada manualmente.
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isDono && character.estado === "rascunho" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => submeterFicha(character.id))}
          className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-60"
        >
          Submeter para aprovação
        </button>
      )}

      {isCriador && character.estado === "submetida" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => aprovarFicha(character.id))}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          Aprovar
        </button>
      )}

      {isCriador &&
        (character.estado === "submetida" || character.estado === "aprovada") && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(() => voltarParaRascunho(character.id))}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900 disabled:opacity-60"
          >
            Devolver a rascunho
          </button>
        )}

      {(isDono || isCriador) && character.estado !== "arquivada" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => arquivarFicha(character.id))}
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900 disabled:opacity-60"
        >
          Arquivar (personagem morto)
        </button>
      )}

      {(isDono || isCriador) && character.estado === "arquivada" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => voltarParaRascunho(character.id))}
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900 disabled:opacity-60"
        >
          Desarquivar
        </button>
      )}

      {(isDono || isCriador) && (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await duplicarFicha(character);
              // duplicarFicha faz redirect() em caso de sucesso — só
              // chega aqui se tiver havido erro.
              if (result && "error" in result) setError(result.error);
            })
          }
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900 disabled:opacity-60"
        >
          Duplicar
        </button>
      )}

      {isCriador && (
        <>
          {!confirmarApagar ? (
            <button
              type="button"
              onClick={() => setConfirmarApagar(true)}
              className="rounded-md px-3 py-1.5 text-sm text-red-400 hover:bg-red-950/40"
            >
              Apagar definitivamente
            </button>
          ) : (
            <span className="flex items-center gap-2 text-sm">
              Apagar de vez, sem hipótese de recuperar?
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    setError(null);
                    // apagarFicha faz redirect("/fichas") em caso de
                    // sucesso — não é preciso (nem seguro) chamar
                    // router.push a seguir, porque o redirect do lado do
                    // servidor já interrompe a execução.
                    const result = await apagarFicha(character.id);
                    if (result && "error" in result) setError(result.error);
                  })
                }
                className="rounded-md bg-red-600 px-2 py-1 text-white hover:bg-red-500"
              >
                Sim, apagar
              </button>
              <button
                type="button"
                onClick={() => setConfirmarApagar(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                Cancelar
              </button>
            </span>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="w-full text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
