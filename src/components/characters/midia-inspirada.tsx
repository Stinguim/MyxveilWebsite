"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adicionarMidiaInspirada,
  removerMidiaInspirada,
} from "@/lib/characters/midia-inspirada-actions";
import type { MidiaInspirada as MidiaInspiradaItem } from "@/lib/characters/types";

type ItemComUrl = MidiaInspiradaItem & { url: string };

export function MidiaInspirada({
  characterId,
  itens,
  podeEditar,
}: {
  characterId: string;
  itens: ItemComUrl[];
  podeEditar: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [legenda, setLegenda] = useState("");
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErro(null);
    setAEnviar(true);

    const formData = new FormData();
    formData.set("imagem", file);
    if (legenda.trim()) formData.set("legenda", legenda.trim());

    const resultado = await adicionarMidiaInspirada(characterId, formData);

    setAEnviar(false);
    if (inputRef.current) inputRef.current.value = "";

    if ("error" in resultado) {
      setErro(resultado.error);
      return;
    }
    setLegenda("");
    router.refresh();
  }

  async function onRemover(itemId: string) {
    if (!confirm("Remover esta imagem da mídia inspirada?")) return;
    setErro(null);
    const resultado = await removerMidiaInspirada(itemId, characterId);
    if (resultado.error) {
      setErro(resultado.error);
      return;
    }
    router.refresh();
  }

  if (!podeEditar && itens.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-neutral-300">Mídia inspirada</h3>

      {itens.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {itens.map((item) => (
            <figure
              key={item.id}
              className="group relative overflow-hidden rounded-md border border-neutral-800 bg-neutral-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.legenda ?? "Mídia inspirada"}
                className="aspect-square w-full object-cover"
              />
              {item.legenda && (
                <figcaption className="px-2 py-1 text-xs text-neutral-400">
                  {item.legenda}
                </figcaption>
              )}
              {podeEditar && (
                <button
                  type="button"
                  onClick={() => onRemover(item.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white opacity-0 hover:bg-red-900 group-hover:opacity-100"
                >
                  remover
                </button>
              )}
            </figure>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-neutral-500">
          Ainda não há imagens de referência/inspiração.
        </p>
      )}

      {podeEditar && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onFileChange}
            className="hidden"
            id={`midia-inspirada-input-${characterId}`}
          />
          <input
            type="text"
            value={legenda}
            onChange={(e) => setLegenda(e.target.value)}
            placeholder="Legenda (opcional)"
            className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm outline-none focus:border-neutral-400"
          />
          <button
            type="button"
            disabled={aEnviar}
            onClick={() => inputRef.current?.click()}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900 disabled:opacity-60"
          >
            {aEnviar ? "A enviar…" : "+ Adicionar imagem"}
          </button>
        </div>
      )}

      {erro && <p className="mt-2 text-xs text-red-400">{erro}</p>}
      <p className="mt-2 text-xs text-neutral-600">PNG, JPEG ou WebP, até 5MB cada.</p>
    </div>
  );
}
