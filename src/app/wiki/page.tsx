import { createClient } from "@/lib/supabase/server";
import { WikiSidebar } from "@/components/wiki/wiki-sidebar";
import { ORDEM_CATEGORIAS } from "@/lib/wiki/types";

// A listagem em si já respeita a RLS (wiki_pages_select): jogadores só
// veem "publicada = true", o CRIADOR vê tudo. Não há filtro extra aqui.
export default async function WikiIndexPage() {
  const supabase = await createClient();

  const { data: paginas } = await supabase
    .from("wiki_pages")
    .select("slug, titulo, categoria, conteudo, publicada")
    .order("ordem", { ascending: true });

  const lista = paginas ?? [];

  // Primeira página pela ordem das categorias (secção 6 da spec), depois
  // por "ordem" dentro da categoria — para dar um ponto de entrada óbvio.
  const primeira = ORDEM_CATEGORIAS.map((categoria) =>
    lista.find((p) => p.categoria === categoria)
  ).find(Boolean);

  return (
    <div className="mx-auto flex max-w-4xl gap-8 px-6 py-10">
      <WikiSidebar paginas={lista} slugAtual={primeira?.slug} />

      <div className="min-w-0 flex-1">
        {primeira ? (
          <article>
            <h1 className="mb-4 text-2xl font-semibold">{primeira.titulo}</h1>
            <div className="whitespace-pre-wrap text-neutral-300">
              {primeira.conteudo}
            </div>
          </article>
        ) : (
          <p className="text-neutral-500">
            A wiki de lore ainda não tem páginas publicadas.
          </p>
        )}
      </div>
    </div>
  );
}
