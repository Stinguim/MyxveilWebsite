"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  Campo,
  CampoTexto,
  CampoSelect,
} from "@/components/campos";
import { SubmitButton } from "@/components/submit-button";
import {
  criarPaginaGuia,
  atualizarPaginaGuia,
  apagarPaginaGuia,
} from "@/lib/guide/actions";
import { CATEGORIAS_GUIA, gerarSlugGuia, type GuidePage } from "@/lib/guide/types";
import { UploadImagemConteudo } from "@/components/content/upload-imagem-conteudo";
import { InserirTituloConteudo } from "@/components/content/inserir-titulo-conteudo";

const textareaClass =
  "mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400";

export function FormPaginaGuia({ pagina }: { pagina?: GuidePage }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [titulo, setTitulo] = useState(pagina?.titulo ?? "");
  const [slugTocado, setSlugTocado] = useState(Boolean(pagina));
  const conteudoRef = useRef<HTMLTextAreaElement>(null);

  async function onSubmit(formData: FormData) {
    setErro(null);

    const resultado = pagina
      ? await atualizarPaginaGuia(pagina.id, formData)
      : await criarPaginaGuia(formData);

    if ("erro" in resultado) {
      setErro(resultado.erro);
      return;
    }

    router.push(`/admin/guia/${resultado.id}`);
    router.refresh();
  }

  async function onApagar() {
    if (!pagina) return;
    if (!confirm(`Apagar a página "${pagina.titulo}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    const resultado = await apagarPaginaGuia(pagina.id);
    if (resultado.erro) {
      setErro(resultado.erro);
      return;
    }
    router.push("/admin/guia");
    router.refresh();
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {erro && (
        <p className="rounded-md border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {erro}
        </p>
      )}

      <Campo label="Título">
        <CampoTexto
          name="titulo"
          defaultValue={pagina?.titulo}
          onChange={(value) => {
            setTitulo(value);
          }}
        />
      </Campo>

      <Campo
        label="Slug"
        hint="Usado no URL (/guia/o-slug). Gerado automaticamente a partir do título, mas podes ajustar."
      >
        <CampoTexto
          name="slug"
          defaultValue={pagina?.slug ?? gerarSlugGuia(titulo)}
          onChange={() => setSlugTocado(true)}
          placeholder={!slugTocado ? gerarSlugGuia(titulo) : undefined}
        />
      </Campo>

      <Campo label="Categoria">
        <CampoSelect
          name="categoria"
          defaultValue={pagina?.categoria}
          options={CATEGORIAS_GUIA}
        />
      </Campo>

      <Campo label="Conteúdo">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <InserirTituloConteudo textareaRef={conteudoRef} />
          <UploadImagemConteudo origem="guia" textareaRef={conteudoRef} />
        </div>
        <textarea
          ref={conteudoRef}
          name="conteudo"
          defaultValue={pagina?.conteudo ?? ""}
          rows={16}
          className={textareaClass}
        />
      </Campo>

      <Campo
        label="Ordem"
        hint="Posição da página dentro da categoria, na sidebar (menor = primeiro)."
      >
        <CampoTexto
          name="ordem"
          type="number"
          defaultValue={pagina?.ordem ?? 0}
        />
      </Campo>

      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input
          type="checkbox"
          name="publicada"
          defaultChecked={pagina?.publicada ?? false}
          className="h-4 w-4 rounded border-neutral-700 bg-neutral-900"
        />
        Publicada (visível a todos os jogadores)
      </label>

      <div className="flex items-center justify-between pt-2">
        <SubmitButton>{pagina ? "Guardar alterações" : "Criar página"}</SubmitButton>

        {pagina && (
          <button
            type="button"
            onClick={onApagar}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Apagar página
          </button>
        )}
      </div>
    </form>
  );
}
