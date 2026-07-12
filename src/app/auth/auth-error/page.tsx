import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Não foi possível iniciar sessão</h1>
      <p className="mt-3 max-w-md text-neutral-400">
        O link pode ter expirado ou já ter sido usado. Tenta iniciar sessão
        novamente.
      </p>
      <Link
        href="/login"
        className="mt-6 rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
      >
        Voltar ao login
      </Link>
    </main>
  );
}
