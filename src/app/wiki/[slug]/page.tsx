import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isCriador } from "@/lib/auth/current-user";
import { WikiSidebar } from "@/components/wiki/wiki-sidebar";
import { TextoComDestaque } from "@/components/wiki/wiki-destaque";

export default async function WikiPaginaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ destaque?: string }>;
}) {
  const { slug } = await params;
  const { destaque } = await searchParams;
  const supabase = await createClient();

  const { data: paginas } = await supabase
    .from("wiki_pages")
    .select("id, slug, titulo, categoria, conteudo, publicada")
    .order("ordem", { ascending: true });

  const lista = paginas ?? [];
  const pagina = lista.find((p) => p.slug === slug);

  // RLS já impede o select de devolver rascunhos a não-CRIADOR, mas a
  // página pode simplesmente não existir — 404 nesse caso.
  if (!pagina) {
    notFound();
  }

  const criador = await isCriador();

  return (
    <div className="mx-auto flex max-w-4xl gap-8 px-6 py-10">
      <WikiSidebar paginas={lista} slugAtual={pagina.slug} />

      <div className="min-w-0 flex-1">
        <article>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">
              <TextoComDestaque texto={pagina.titulo} termo={destaque} />
            </h1>
            {criador && (
              <div className="flex items-center gap-3">
                {!pagina.publicada && (
                  <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-xs text-amber-300">
                    Rascunho
                  </span>
                )}
                <Link
                  href={`/admin/wiki/${pagina.id}`}
                  className="text-sm text-neutral-400 hover:text-white"
                >
                  Editar
                </Link>
              </div>
            )}
          </div>
          <div className="whitespace-pre-wrap text-neutral-300">
            <TextoComDestaque texto={pagina.conteudo} termo={destaque} />
          </div>
        </article>
      </div>
    </div>
  );
}
