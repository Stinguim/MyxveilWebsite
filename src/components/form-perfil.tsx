"use client";

import { atualizarPerfil } from "@/lib/auth/profile-actions";
import { SubmitButton } from "@/components/submit-button";
import { useActionState } from "react";
import type { Profile } from "@/lib/auth/current-user";

type ActionResult = { error: string } | { success: true } | undefined;

export function FormPerfil({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    async (_prevState, formData) => atualizarPerfil(formData),
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="nome_alcunha" className="block text-sm text-neutral-300">
          Nome / alcunha
        </label>
        <input
          id="nome_alcunha"
          name="nome_alcunha"
          type="text"
          defaultValue={profile.nome_alcunha ?? ""}
          placeholder="Como queres que te chamem"
          className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </div>

      <div>
        <label
          htmlFor="experiencia_rpg"
          className="block text-sm text-neutral-300"
        >
          Experiência prévia em RPG
        </label>
        <select
          id="experiencia_rpg"
          name="experiencia_rpg"
          defaultValue={profile.experiencia_rpg ?? ""}
          className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        >
          <option value="">— Seleciona —</option>
          <option value="nunca_jogou">Nunca joguei</option>
          <option value="algumas_vezes">Já joguei algumas vezes (1-3)</option>
          <option value="varias_vezes">Já joguei várias vezes (4-7)</option>
          <option value="regular">Jogo regularmente</option>
        </select>
      </div>

      <SubmitButton
        pendingLabel="A guardar…"
        className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-60"
      >
        Guardar
      </SubmitButton>

      {state && "error" in state && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <p className="text-sm text-emerald-400">Guardado.</p>
      )}
    </form>
  );
}
