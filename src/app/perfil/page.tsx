import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { FormPerfil } from "@/components/form-perfil";
import { GestaoIdentidades } from "@/components/gestao-identidades";

export default async function PerfilPage() {
  const current = await getCurrentUser();

  if (!current) {
    redirect("/login?next=/perfil");
  }

  const supabase = await createClient();
  const { data: identitiesData } = await supabase.auth.getUserIdentities();
  const identities = identitiesData?.identities ?? [];

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold">O teu perfil</h1>
      <p className="mt-2 text-sm text-neutral-400">
        {current.profile.role === "criador"
          ? "És o CRIADOR (DM) deste mundo."
          : "Estes dados ajudam a facilitar a comunicação e a ajustar sessões, caso tenhas alguma necessidade."}
      </p>

      <section className="mt-8">
        <FormPerfil profile={current.profile} />
      </section>

      <hr className="my-8 border-neutral-800" />

      <section>
        <GestaoIdentidades identities={identities} />
      </section>
    </main>
  );
}
