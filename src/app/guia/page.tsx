import { createClient } from "@/lib/supabase/server";
import { GuiaSidebar } from "@/components/guide/guia-sidebar";
import { ORDEM_CATEGORIAS_GUIA } from "@/lib/guide/types";

// A listagem em si já respeita a RLS (guide_pages_select): jogadores só
// veem "publicada = true", o CRIADOR vê tudo. Não há filtro extra aqui.
export default async function GuiaIndexPage() {
  const supabase = await createClient();

  const { data: paginas } = await supabase
    .from("guide_pages")
    .select("slug, titulo, categoria, conteudo, publicada")
    .order("ordem", { ascending: true });

  const lista = paginas ?? [];

  const primeira = ORDEM_CATEGORIAS_GUIA.map((categoria) =>
    lista.find((p) => p.categoria === categoria)
  ).find(Boolean);

  return (
    <div className="mx-auto flex max-w-4xl gap-8 px-6 py-10">
      <GuiaSidebar paginas={lista} slugAtual={primeira?.slug} />

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
            O guia de regras ainda não tem páginas publicadas.
          </p>
        )}
      </div>
    </div>
  );
}
