import { createClient } from "@/lib/supabase/server";
import { WikiSidebar } from "@/components/wiki/wiki-sidebar";
import { TextoComDestaque } from "@/components/wiki/wiki-destaque";
import { ConteudoComImagens } from "@/components/content/conteudo-com-imagens";

// A listagem em si já respeita a RLS (wiki_pages_select): jogadores só
// veem "publicada = true", o CRIADOR vê tudo. Não há filtro extra aqui.
export default async function WikiIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ destaque?: string }>;
}) {
  const { destaque } = await searchParams;
  const supabase = await createClient();

  // Categorias e páginas buscadas em separado (ver nota em
  // admin/wiki/page.tsx) — evita depender do tipo inferido para um join
  // aninhado categoria:wiki_categorias(...), que sem tipos gerados da
  // Database o Postgrest tipa como array em vez de objeto único.
  const [{ data: paginas }, { data: categorias }] = await Promise.all([
    supabase
      .from("wiki_pages")
      .select("slug, titulo, categoria_id, conteudo, publicada, ordem")
      .order("ordem", { ascending: true }),
    supabase.from("wiki_categorias").select("*").order("ordem", { ascending: true }),
  ]);

  const lista = paginas ?? [];
  const listaCategorias = categorias ?? [];
  const categoriaPorId = new Map(listaCategorias.map((c) => [c.id, c]));

  // Primeira página pela ordem das categorias, depois por "ordem" dentro
  // da categoria — para dar um ponto de entrada óbvio.
  const primeira = [...lista].sort((a, b) => {
    const ordemCategoriaA = categoriaPorId.get(a.categoria_id)?.ordem ?? 0;
    const ordemCategoriaB = categoriaPorId.get(b.categoria_id)?.ordem ?? 0;
    if (ordemCategoriaA !== ordemCategoriaB) return ordemCategoriaA - ordemCategoriaB;
    return a.ordem - b.ordem;
  })[0];

  return (
    <div className="mx-auto flex max-w-4xl gap-8 px-6 py-10">
      <WikiSidebar paginas={lista} categorias={listaCategorias} slugAtual={primeira?.slug} />

      <div className="min-w-0 flex-1">
        {primeira ? (
          <article>
            <h1 className="mb-4 text-2xl font-semibold">
              <TextoComDestaque texto={primeira.titulo} termo={destaque} />
            </h1>
            <ConteudoComImagens
              conteudo={primeira.conteudo}
              renderTexto={(texto) => (
                <TextoComDestaque texto={texto} termo={destaque} />
              )}
            />
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
