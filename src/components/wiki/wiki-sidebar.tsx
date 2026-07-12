import Link from "next/link";
import { CATEGORIA_LABEL, ORDEM_CATEGORIAS, type WikiPage } from "@/lib/wiki/types";

export function WikiSidebar({
  paginas,
  slugAtual,
}: {
  paginas: Pick<WikiPage, "slug" | "titulo" | "categoria">[];
  slugAtual?: string;
}) {
  const porCategoria = ORDEM_CATEGORIAS.map((categoria) => ({
    categoria,
    paginas: paginas.filter((p) => p.categoria === categoria),
  })).filter((grupo) => grupo.paginas.length > 0);

  return (
    <nav className="w-56 shrink-0 space-y-6 border-r border-neutral-800 pr-4">
      {porCategoria.map(({ categoria, paginas: paginasDaCategoria }) => (
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
      ))}
      {porCategoria.length === 0 && (
        <p className="text-sm text-neutral-500">Ainda não há páginas publicadas.</p>
      )}
    </nav>
  );
}
