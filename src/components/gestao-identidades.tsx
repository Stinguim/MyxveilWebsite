"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  associarDiscord,
  associarEmailPassword,
  desassociarIdentidade,
} from "@/lib/auth/profile-actions";
import { SubmitButton } from "@/components/submit-button";
import { DiscordButton } from "@/components/discord-button";
import type { UserIdentity } from "@supabase/supabase-js";

type ActionResult = { error: string } | { success: true } | undefined;

export function GestaoIdentidades({
  identities,
}: {
  identities: UserIdentity[];
}) {
  const temDiscord = identities.some((i) => i.provider === "discord");
  const temEmail = identities.some((i) => i.provider === "email");
  const podeDesassociar = identities.length >= 2;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-neutral-300">
          Métodos de login associados
        </h3>
        <ul className="mt-2 space-y-2">
          {identities.map((identity) => (
            <IdentityRow
              key={identity.identity_id}
              identity={identity}
              podeRemover={podeDesassociar}
            />
          ))}
        </ul>
      </div>

      {!temDiscord && (
        <div>
          <p className="mb-2 text-sm text-neutral-400">
            Associa a tua conta Discord para também poderes entrar por ela.
          </p>
          <DiscordButton action={associarDiscord}>
            Associar Discord
          </DiscordButton>
        </div>
      )}

      {!temEmail && <FormAssociarEmail />}
    </div>
  );
}

function IdentityRow({
  identity,
  podeRemover,
}: {
  identity: UserIdentity;
  podeRemover: boolean;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<ActionResult, FormData>(
    async () => desassociarIdentidade(identity.identity_id),
    undefined
  );

  // Sem isto, a lista `identities` (prop vinda do Server Component pai)
  // fica desatualizada depois de remover uma identidade — o botão
  // "Remover" das restantes linhas continuaria visível mesmo que já só
  // sobrasse uma identidade, até um refresh manual da página.
  useEffect(() => {
    if (state && "success" in state) {
      router.refresh();
    }
  }, [state, router]);

  const label =
    identity.provider === "discord"
      ? `Discord${
          identity.identity_data?.custom_claims &&
          typeof identity.identity_data.custom_claims === "object" &&
          "global_name" in identity.identity_data.custom_claims
            ? ` (${identity.identity_data.custom_claims.global_name})`
            : ""
        }`
      : identity.provider === "email"
        ? `Email (${identity.identity_data?.email ?? ""})`
        : identity.provider;

  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-neutral-800 px-3 py-2">
      <span className="text-sm">{label}</span>
      {podeRemover && (
        <form action={formAction}>
          <SubmitButton
            pendingLabel="A remover…"
            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-60"
          >
            Remover
          </SubmitButton>
        </form>
      )}
      {state && "error" in state && (
        <p role="alert" className="text-xs text-red-400">
          {state.error}
        </p>
      )}
    </li>
  );
}

function FormAssociarEmail() {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    async (_prevState, formData) => associarEmailPassword(formData),
    undefined
  );

  return (
    <div>
      <p className="mb-2 text-sm text-neutral-400">
        Define um email e password para também poderes entrar sem o Discord.
      </p>
      <form action={formAction} className="space-y-3">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Password (mínimo 8 caracteres)"
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
        <SubmitButton
          pendingLabel="A associar…"
          className="w-full rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-60"
        >
          Associar email
        </SubmitButton>
      </form>
      {state && "error" in state && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <p className="mt-2 text-sm text-emerald-400">
          Verifica o teu email para confirmar a associação.
        </p>
      )}
    </div>
  );
}
