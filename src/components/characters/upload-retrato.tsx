"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { atualizarRetrato, removerRetrato } from "@/lib/characters/retrato-actions";
import { RetratoPersonagem } from "@/components/characters/retrato-personagem";

export function UploadRetrato({
  characterId,
  nome,
  urlAtual,
}: {
  characterId: string;
  nome: string;
  urlAtual: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErro(null);
    setAEnviar(true);

    const formData = new FormData();
    formData.set("retrato", file);
    const resultado = await atualizarRetrato(characterId, formData);

    setAEnviar(false);
    if ("error" in resultado) {
      setErro(resultado.error);
      return;
    }
    router.refresh();
  }

  async function onRemover() {
    if (!confirm("Remover o retrato desta ficha?")) return;
    setErro(null);
    const resultado = await removerRetrato(characterId);
    if (resultado.error) {
      setErro(resultado.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <RetratoPersonagem url={urlAtual} nome={nome} size="lg" />
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
        <button
          type="button"
          disabled={aEnviar}
          onClick={() => inputRef.current?.click()}
          className="block rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900 disabled:opacity-60"
        >
          {aEnviar ? "A enviar…" : urlAtual ? "Trocar retrato" : "Adicionar retrato"}
        </button>
        {urlAtual && (
          <button
            type="button"
            onClick={onRemover}
            className="block text-xs text-neutral-500 hover:text-red-400"
          >
            Remover retrato
          </button>
        )}
        {erro && <p className="text-xs text-red-400">{erro}</p>}
        <p className="text-xs text-neutral-600">PNG, JPEG ou WebP, até 5MB.</p>
      </div>
    </div>
  );
}
