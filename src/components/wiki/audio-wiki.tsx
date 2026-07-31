"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { atualizarAudioWiki, removerAudioWiki } from "@/lib/wiki/audio-actions";

/**
 * Player de áudio para a página de wiki, colocado logo abaixo do
 * título. Em modo leitura (podeEditar=false) mostra só o <audio
 * controls> quando há audioUrl. Em modo edição (CRIADOR, podeEditar=
 * true) mostra sempre o bloco, com botão de upload/trocar/remover —
 * igual em espírito a UploadRetrato.
 */
export function AudioWiki({
  paginaId,
  audioUrl,
  podeEditar = false,
}: {
  paginaId: string;
  audioUrl: string | null;
  podeEditar?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setErro(null);
    setAEnviar(true);

    const formData = new FormData();
    formData.set("audio", file);
    const resultado = await atualizarAudioWiki(paginaId, formData);

    setAEnviar(false);

    if ("error" in resultado) {
      setErro(resultado.error);
      return;
    }

    router.refresh();
  }

  async function onRemover() {
    if (!confirm("Remover o áudio desta página?")) return;
    setErro(null);
    const resultado = await removerAudioWiki(paginaId);
    if (resultado.error) {
      setErro(resultado.error);
      return;
    }
    router.refresh();
  }

  if (!podeEditar) {
    if (!audioUrl) return null;
    return (
      <div className="mb-4">
        <audio controls src={audioUrl} className="w-full" />
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-2">
      {audioUrl && <audio controls src={audioUrl} className="w-full" />}

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={aEnviar}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900 disabled:opacity-50"
        >
          {aEnviar ? "A enviar..." : audioUrl ? "Trocar áudio" : "Adicionar áudio"}
        </button>
        {audioUrl && (
          <button
            type="button"
            onClick={onRemover}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Remover áudio
          </button>
        )}
        <span className="text-xs text-neutral-500">
          MP3, WAV, OGG ou M4A, até 10MB.
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.ogg,.m4a"
        onChange={onFileChange}
        className="hidden"
      />
      {erro && <p className="text-xs text-red-400">{erro}</p>}
    </div>
  );
}
