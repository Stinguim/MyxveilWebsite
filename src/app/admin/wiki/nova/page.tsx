import { redirect } from "next/navigation";
import { isCriador } from "@/lib/auth/current-user";
import { FormPaginaWiki } from "@/components/wiki/form-pagina-wiki";

export default async function NovaPaginaWikiPage() {
  if (!(await isCriador())) {
    redirect("/wiki");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Nova página da wiki</h1>
      <FormPaginaWiki />
    </div>
  );
}
