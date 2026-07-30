"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CATEGORIA_LABEL,
  ORDEM_CATEGORIAS,
  type WikiPage,
} from "@/lib/wiki/types";
import { contarOcorrencias } from "@/components/wiki/wiki-destaque";

type PaginaPesquisavel = Pick<
  WikiPage,
  "slug" | "titulo" | "categoria" | "conteudo"
>;

export function WikiSidebar({
  paginas,
  slugAtual,
}: {
  paginas: PaginaPesquisavel[];
  slugAtual?: string;
}) {
  const [termo, setTermo] = useState("");

  const porCategoria = ORDEM_CATEGORIAS.map((categoria) => ({
    categoria,
    paginas: paginas.filter((p) => p.categoria === categoria),
  })).filter((grupo) => grupo.paginas.length > 0);

  const resultados = useMemo(() => {
    if (!termo.trim()) return [];

    return paginas
      .map((pagina) => ({
        pagina,
        ocorrencias:
          contarOcorrencias(pagina.titulo, termo) +
          contarOcorrencias(pagina.conteudo, termo),
      }))
      .filter((r) => r.ocorrencias > 0)
      .sort((a, b) => b.ocorrencias - a.ocorrencias);
  }, [paginas, termo]);

  const aPesquisar = termo.trim().length > 0;

  return (
    <nav className="w-56 shrink-0 space-y-6 border-r border-neutral-800 pr-4">
      <div>
        <label htmlFor="wiki-search" className="sr-only">
          Pesquisar na wiki
        </label>
        <input
          id="wiki-search"
          type="search"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Pesquisar na wiki..."
          className="w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none"
        />
      </div>

      {aPesquisar ? (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Resultados
          </h3>
          {resultados.length > 0 ? (
            <ul className="space-y-1">
              {resultados.map(({ pagina, ocorrencias }) => (
                <li key={pagina.slug}>
                  <Link
                    href={`/wiki/${pagina.slug}?destaque=${encodeURIComponent(
                      termo.trim()
                    )}`}
                    className={
                      "block rounded px-2 py-1 text-sm " +
                      (pagina.slug === slugAtual
                        ? "bg-neutral-800 text-white"
                        : "text-neutral-300 hover:bg-neutral-900 hover:text-white")
                    }
                  >
                    {pagina.titulo}{" "}
                    <span className="text-neutral-500">({ocorrencias})</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">Sem resultados.</p>
          )}
        </div>
      ) : (
        porCategoria.map(({ categoria, paginas: paginasDaCategoria }) => (
          <div key={categoria}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {CATEGORIA_LABEL[categoria]}
            </h3>
            <ul className="space-y-1">
              {paginasDaCategoria.map((pagina) => (
                <li key={pagina.slug}>
                  <Link
                    href={`/wiki/${pagina.slug}`}
                    className={
                      "block rounded px-2 py-1 text-sm " +
                      (pagina.slug === slugAtual
                        ? "bg-neutral-800 text-white"
                        : "text-neutral-300 hover:bg-neutral-900 hover:text-white")
                    }
                  >
                    {pagina.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      {!aPesquisar && porCategoria.length === 0 && (
        <p className="text-sm text-neutral-500">Ainda não há páginas publicadas.</p>
      )}
    </nav>
  );
}
