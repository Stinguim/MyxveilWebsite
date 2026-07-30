import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isCriador } from "@/lib/auth/current-user";
import { FormPaginaGuia } from "@/components/guide/form-pagina-guia";

export default async function EditarPaginaGuiaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isCriador())) {
    redirect("/guia");
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: pagina } = await supabase
    .from("guide_pages")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!pagina) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Editar: {pagina.titulo}</h1>
        <Link
          href={`/guia/${pagina.slug}`}
          className="text-sm text-neutral-400 hover:text-white"
        >
          Ver página publicada
        </Link>
      </div>
      <FormPaginaGuia pagina={pagina} />
    </div>
  );
}
