import Link from "next/link";
import { registarComEmail, loginComDiscord } from "@/lib/auth/actions";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { DiscordButton } from "@/components/discord-button";

export default function RegistoPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Criar conta em Myxveil</h1>
        <p className="mt-2 text-sm text-neutral-400">
          O registo é aberto — não precisas de convite.
        </p>

        <div className="mt-6">
          <DiscordButton action={loginComDiscord}>
            Continuar com Discord
          </DiscordButton>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-neutral-500">
          <div className="h-px flex-1 bg-neutral-800" />
          ou com email
          <div className="h-px flex-1 bg-neutral-800" />
        </div>

        <ActionForm action={registarComEmail} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-neutral-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm text-neutral-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
            <p className="mt-1 text-xs text-neutral-500">Mínimo 8 caracteres.</p>
          </div>
          <div>
            <label
              htmlFor="confirmarPassword"
              className="block text-sm text-neutral-300"
            >
              Confirmar password
            </label>
            <input
              id="confirmarPassword"
              name="confirmarPassword"
              type="password"
              required
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>
          <SubmitButton pendingLabel="A criar conta…">
            Criar conta
          </SubmitButton>
        </ActionForm>

        <p className="mt-6 text-center text-sm text-neutral-400">
          Já tens conta?{" "}
          <Link href="/login" className="text-neutral-100 underline">
            Entra
          </Link>
        </p>
      </div>
    </main>
  );
}
