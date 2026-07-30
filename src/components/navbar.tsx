import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logout } from "@/lib/auth/actions";

export async function Navbar() {
  const current = await getCurrentUser();

  return (
    <header className="border-b border-veil-line bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg tracking-wide text-foreground">
          Myx<span className="text-veil-amber-soft">veil</span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {current ? (
            <>
              <Link href="/fichas" className="text-muted hover:text-veil-amber-soft">
                Fichas
              </Link>
              <Link href="/mapa" className="text-muted hover:text-veil-amber-soft">
                Mapa
              </Link>
              <Link href="/wiki" className="text-muted hover:text-veil-amber-soft">
                Wiki
              </Link>
              <Link href="/guia" className="text-muted hover:text-veil-amber-soft">
                Guia
              </Link>
              {current.profile.role === "criador" && (
                <Link
                  href="/admin"
                  className="text-muted hover:text-veil-amber-soft"
                >
                  Admin
                </Link>
              )}
              <Link href="/perfil" className="text-muted hover:text-veil-amber-soft">
                {current.profile.nome_alcunha || "Perfil"}
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-muted/70 hover:text-veil-amber-soft"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-muted hover:text-veil-amber-soft">
                Entrar
              </Link>
              <Link
                href="/registo"
                className="rounded-md bg-veil-amber px-3 py-1.5 text-background-deep font-medium hover:bg-veil-amber-soft"
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
