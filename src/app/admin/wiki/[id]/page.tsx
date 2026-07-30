import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isCriador } from "@/lib/auth/current-user";
import { FormPaginaWiki } from "@/components/wiki/form-pagina-wiki";

export default async function EditarPaginaWikiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isCriador())) {
    redirect("/wiki");
  }

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: pagina }, { data: categorias }] = await Promise.all([
    supabase.from("wiki_pages").select("*").eq("id", id).maybeSingle(),
    supabase.from("wiki_categorias").select("*").order("ordem", { ascending: true }),
  ]);

  if (!pagina) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Editar: {pagina.titulo}</h1>
        <Link
          href={`/wiki/${pagina.slug}`}
          className="text-sm text-neutral-400 hover:text-white"
        >
          Ver página publicada
        </Link>
      </div>
      <FormPaginaWiki pagina={pagina} categorias={categorias ?? []} />
    </div>
  );
}
