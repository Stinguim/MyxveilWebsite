import { redirect } from "next/navigation";
import { isCriador } from "@/lib/auth/current-user";
import { FormPaginaGuia } from "@/components/guide/form-pagina-guia";

export default async function NovaPaginaGuiaPage() {
  if (!(await isCriador())) {
    redirect("/guia");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Nova página do Guia</h1>
      <FormPaginaGuia />
    </div>
  );
}
