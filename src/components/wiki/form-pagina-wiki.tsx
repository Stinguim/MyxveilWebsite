"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Campo,
  CampoTexto,
  CampoTextarea,
  CampoSelect,
} from "@/components/campos";
import { SubmitButton } from "@/components/submit-button";
import {
  criarPaginaWiki,
  atualizarPaginaWiki,
  apagarPaginaWiki,
} from "@/lib/wiki/actions";
import { CATEGORIAS_WIKI, gerarSlug, type WikiPage } from "@/lib/wiki/types";

// group_id fica de fora do formulário (secção 5/6: ligação a "super-nós"
// do mapa de relações) até essa UI existir — o schema já suporta, o
// formulário pode ganhar o select assim que /admin/grupos existir.

export function FormPaginaWiki({ pagina }: { pagina?: WikiPage }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [titulo, setTitulo] = useState(pagina?.titulo ?? "");
  const [slugTocado, setSlugTocado] = useState(Boolean(pagina));

  async function onSubmit(formData: FormData) {
    setErro(null);

    const resultado = pagina
      ? await atualizarPaginaWiki(pagina.id, formData)
      : await criarPaginaWiki(formData);

    if ("erro" in resultado) {
      setErro(resultado.erro);
      return;
    }

    router.push(`/admin/wiki/${resultado.id}`);
    router.refresh();
  }

  async function onApagar() {
    if (!pagina) return;
    if (!confirm(`Apagar a página "${pagina.titulo}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    const resultado = await apagarPaginaWiki(pagina.id);
    if (resultado.erro) {
      setErro(resultado.erro);
      return;
    }
    router.push("/admin/wiki");
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
        hint="Usado no URL (/wiki/o-slug). Gerado automaticamente a partir do título, mas podes ajustar."
      >
        <CampoTexto
          name="slug"
          defaultValue={pagina?.slug ?? gerarSlug(titulo)}
          onChange={() => setSlugTocado(true)}
          placeholder={!slugTocado ? gerarSlug(titulo) : undefined}
        />
      </Campo>

      <Campo label="Categoria">
        <CampoSelect
          name="categoria"
          defaultValue={pagina?.categoria}
          options={CATEGORIAS_WIKI}
        />
      </Campo>

      <Campo
        label="Conteúdo"
        hint="Partes ainda por revelar aos jogadores: deixa a página como rascunho (não publicada) em vez de escrever versões incompletas do texto."
      >
        <CampoTextarea name="conteudo" defaultValue={pagina?.conteudo} rows={16} />
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
