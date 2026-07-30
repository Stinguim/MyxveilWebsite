import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCriador } from "@/lib/auth/current-user";
import { GestaoCategoriasWiki } from "@/components/wiki/gestao-categorias-wiki";

export default async function AdminWikiCategoriasPage() {
  if (!(await isCriador())) {
    redirect("/wiki");
  }

  const supabase = await createClient();
  const { data: categorias } = await supabase
    .from("wiki_categorias")
    .select("*")
    .order("ordem", { ascending: true });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categorias da Wiki</h1>
        <Link
          href="/admin/wiki"
          className="text-sm text-neutral-400 hover:text-white"
        >
          Voltar à gestão da wiki
        </Link>
      </div>

      <GestaoCategoriasWiki categorias={categorias ?? []} />
    </div>
  );
}
