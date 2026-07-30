"use client";

import { useRef, useState } from "react";
import { uploadImagemConteudo } from "@/lib/content/imagem-conteudo-actions";

/**
 * Botão "Inserir imagem" para colocar por cima de um <textarea> de
 * conteúdo (wiki ou guia). Faz upload da imagem escolhida e insere
 * ![legenda](url) na posição atual do cursor do textarea — a meio ou no
 * fim do texto, conforme onde o cursor estiver.
 *
 * `textareaRef` tem de apontar diretamente para o <textarea> do campo
 * "conteudo". Nota: CampoTextarea (components/campos.tsx) não expõe
 * ref, por isso o campo de conteúdo nos formulários de wiki/guia usa um
 * <textarea> simples em vez de <CampoTextarea>, só para este campo.
 */
export function UploadImagemConteudo({
  origem,
  textareaRef,
  onInserir,
}: {
  origem: "wiki" | "guia";
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Chamado com o novo valor completo do conteúdo, para sincronizar
   * estado controlado (se o textarea for controlado por state). */
  onInserir?: (novoConteudo: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo ficheiro outra vez
    if (!file) return;

    const legenda = window.prompt("Legenda da imagem (opcional):", "") ?? "";

    setErro(null);
    setAEnviar(true);

    const formData = new FormData();
    formData.set("imagem", file);
    const resultado = await uploadImagemConteudo(origem, formData);

    setAEnviar(false);

    if ("error" in resultado) {
      setErro(resultado.error);
      return;
    }

    const markdown = `![${legenda.trim()}](${resultado.url})`;
    const textarea = textareaRef.current;

    if (!textarea) {
      // Sem referência ao textarea, não há como saber a posição do
      // cursor — cai para o fim do conteúdo atual.
      onInserir?.(markdown);
      return;
    }

    const inicio = textarea.selectionStart ?? textarea.value.length;
    const fim = textarea.selectionEnd ?? textarea.value.length;
    const antes = textarea.value.slice(0, inicio);
    const depois = textarea.value.slice(fim);

    // Garante que a imagem fica numa linha própria, sem colar ao texto
    // à volta.
    const prefixo = antes && !antes.endsWith("\n") ? "\n" : "";
    const sufixo = depois && !depois.startsWith("\n") ? "\n" : "";
    const novoValor = antes + prefixo + markdown + sufixo + depois;

    textarea.value = novoValor;
    onInserir?.(novoValor);

    // Recoloca o cursor logo a seguir ao markdown inserido.
    const novaPosicao = (antes + prefixo + markdown).length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(novaPosicao, novaPosicao);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={aEnviar}
        onClick={() => inputRef.current?.click()}
        className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900 disabled:opacity-50"
      >
        {aEnviar ? "A enviar..." : "Inserir imagem"}
      </button>
      <span className="text-xs text-neutral-500">
        Insere no texto na posição do cursor. PNG, JPEG ou WebP, até 5MB.
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onFileChange}
        className="hidden"
      />
      {erro && <span className="text-xs text-red-400">{erro}</span>}
    </div>
  );
}
