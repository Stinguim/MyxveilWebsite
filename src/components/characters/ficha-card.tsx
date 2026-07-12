import Link from "next/link";
import type { CharacterWithOwner } from "@/lib/characters/types";
import { ESTADO_LABELS } from "@/lib/characters/types";
import { RetratoPersonagem } from "@/components/characters/retrato-personagem";

export function FichaCard({
  character,
  retratoUrl,
}: {
  character: CharacterWithOwner;
  retratoUrl: string | null;
}) {
  const ownerLabel =
    character.owner_nome_alcunha || character.owner_discord_username || "Jogador";

  return (
    <Link
      href={`/fichas/${character.id}`}
      className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 hover:border-neutral-600"
    >
      <RetratoPersonagem url={retratoUrl} nome={character.nome} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-medium">{character.nome}</h3>
            <p className="truncate text-sm text-neutral-500">
              Criado por {ownerLabel}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400">
              {ESTADO_LABELS[character.estado]}
            </span>
            {character.visibilidade === "privada" && (
              <span className="rounded-full border border-amber-800 px-2 py-0.5 text-xs text-amber-400">
                Privada
              </span>
            )}
          </div>
        </div>
        {character.campanha && (
          <p className="mt-1 truncate text-xs text-neutral-500">
            {character.campanha}
          </p>
        )}
      </div>
    </Link>
  );
}
