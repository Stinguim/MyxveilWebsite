import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCriador } from "@/lib/auth/current-user";

export default async function AdminWikiPage() {
  if (!(await isCriador())) {
    redirect("/wiki");
  }

  const supabase = await createClient();

  const { data: paginas } = await supabase
    .from("wiki_pages")
    .select("id, slug, titulo, publicada, ordem, categoria:wiki_categorias(nome, ordem)")
    .order("ordem", { ascending: true });

  // Ordena no cliente por (categoria.ordem, página.ordem) — o Postgrest
  // não permite ordenar por uma coluna da tabela relacionada
  // diretamente numa única chamada .order() encadeada de forma simples.
  const lista = [...(paginas ?? [])].sort((a, b) => {
    const ordemCategoriaA = a.categoria?.ordem ?? 0;
    const ordemCategoriaB = b.categoria?.ordem ?? 0;
    if (ordemCategoriaA !== ordemCategoriaB) return ordemCategoriaA - ordemCategoriaB;
    return a.ordem - b.ordem;
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gestão da Wiki</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/wiki/categorias"
            className="text-sm text-neutral-400 hover:text-white"
          >
            Gerir categorias
          </Link>
          <Link
            href="/admin/wiki/nova"
            className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm text-neutral-900 hover:bg-white"
          >
            Nova página
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2 font-medium">Título</th>
              <th className="px-4 py-2 font-medium">Categoria</th>
              <th className="px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((pagina) => (
              <tr
                key={pagina.id}
                className="border-t border-neutral-800 hover:bg-neutral-900/50"
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/wiki/${pagina.id}`}
                    className="text-neutral-100 hover:underline"
                  >
                    {pagina.titulo}
                  </Link>
                </td>
                <td className="px-4 py-2 text-neutral-400">
                  {pagina.categoria?.nome ?? "—"}
                </td>
                <td className="px-4 py-2">
                  {pagina.publicada ? (
                    <span className="text-emerald-400">Publicada</span>
                  ) : (
                    <span className="text-amber-400">Rascunho</span>
                  )}
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-neutral-500">
                  Ainda não há páginas. Cria a primeira.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
