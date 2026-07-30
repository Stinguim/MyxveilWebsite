import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

function CartaoAdmin({
  href,
  titulo,
  descricao,
  contagem,
}: {
  href: string;
  titulo: string;
  descricao: string;
  contagem?: number;
}) {
  return (
    <Link
      href={href}
      className="block rounded-md border border-neutral-800 p-4 hover:border-neutral-600 hover:bg-neutral-900/50"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-neutral-100">{titulo}</h2>
        {typeof contagem === "number" && contagem > 0 && (
          <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-xs text-amber-300">
            {contagem}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-neutral-500">{descricao}</p>
    </Link>
  );
}

export default async function AdminPage() {
  const current = await getCurrentUser();

  if (!current) {
    redirect("/login?next=/admin");
  }

  if (current.profile.role !== "criador") {
    notFound();
  }

  const supabase = await createClient();

  // Contagem de fichas submetidas, à espera de aprovação — dá ao CRIADOR
  // um ponto de partida óbvio ao entrar na área de administração.
  const { count: fichasPorAprovar } = await supabase
    .from("characters")
    .select("id", { count: "exact", head: true })
    .eq("estado", "submetida");

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Área do CRIADOR</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Gestão de conteúdo e aprovação de fichas do Myxveil.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CartaoAdmin
          href="/fichas?estado=submetida"
          titulo="Fichas por aprovar"
          descricao="Rever e aprovar fichas submetidas pelos jogadores."
          contagem={fichasPorAprovar ?? 0}
        />
        <CartaoAdmin
          href="/admin/wiki"
          titulo="Wiki de lore"
          descricao="Criar, editar e publicar páginas da wiki."
        />
        <CartaoAdmin
          href="/admin/guia"
          titulo="Guia de regras"
          descricao="Criar, editar e publicar páginas do guia de regras."
        />
        <CartaoAdmin
          href="/admin/mapa"
          titulo="Mapa de relações"
          descricao="Gerir ligações entre personagens e grupos/facções."
        />
      </div>
    </main>
  );
}
