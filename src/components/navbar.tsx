import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logout } from "@/lib/auth/actions";

export async function Navbar() {
  const current = await getCurrentUser();

  return (
    <header className="border-b border-neutral-800">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold">
          Myxveil
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {current ? (
            <>
              <Link href="/fichas" className="text-neutral-300 hover:text-white">
                Fichas
              </Link>
              <Link href="/mapa" className="text-neutral-300 hover:text-white">
                Mapa
              </Link>
              <Link href="/wiki" className="text-neutral-300 hover:text-white">
                Wiki
              </Link>
              {current.profile.role === "criador" && (
                <Link
                  href="/admin"
                  className="text-neutral-300 hover:text-white"
                >
                  Admin
                </Link>
              )}
              <Link href="/perfil" className="text-neutral-300 hover:text-white">
                {current.profile.nome_alcunha || "Perfil"}
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-neutral-400 hover:text-white"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-neutral-300 hover:text-white">
                Entrar
              </Link>
              <Link
                href="/registo"
                className="rounded-md bg-neutral-100 px-3 py-1.5 text-neutral-900 hover:bg-white"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
