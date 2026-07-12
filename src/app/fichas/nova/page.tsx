import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { FormFicha } from "@/components/characters/form-ficha";

export default async function NovaFichaPage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/login?next=/fichas/nova");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Nova ficha</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Preenche o que quiseres agora — podes guardar como rascunho e
        continuar mais tarde.
      </p>
      <div className="mt-8">
        <FormFicha />
      </div>
    </main>
  );
}
