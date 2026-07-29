import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden px-6">
      {/* Campo de estrelas — fixo, sem geração aleatória em runtime (evita hydration mismatch) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <StarField />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background-deep)_82%)]" />
      </div>

      <section className="flex w-full flex-col items-center justify-center pt-28 pb-20 text-center sm:pt-36">
        <h1 className="font-display text-7xl font-semibold tracking-tight text-foreground sm:text-9xl">
          Myx<span className="text-veil-amber-soft">veil</span>
        </h1>

        <p className="mt-8 max-w-4xl text-center text-xl leading-relaxed text-muted sm:text-2xl">
          Fichas de personagem, mapa de relações e wiki de lore do RPG homebrew
          Myxveil.
        </p>
      </section>

      {/* Três portais de navegação */}
      <section className="mb-28 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        <PortalCard
          href="/fichas"
          label="Fichas"
          description="Cria e gere as tuas personagens."
          icon={<EyeIcon />}
        />
        <PortalCard
          href="/mapa"
          label="Mapa de relações"
          description="Como as personagens se relacionam."
          icon={<NodeIcon />}
        />
        <PortalCard
          href="/wiki"
          label="Wiki de lore"
          description="História e regras do mundo."
          icon={<BookIcon />}
        />
      </section>
    </main>
  );
}

// Posições, tamanhos e opacidades fixos — gerados uma vez, não em runtime.
const STARS = [
  [3, 8, 1.2, 0.9], [9, 22, 0.8, 0.6], [14, 5, 1.6, 0.8], [18, 40, 0.9, 0.5],
  [22, 14, 1.1, 0.7], [27, 60, 0.7, 0.4], [31, 30, 1.4, 0.9], [36, 8, 0.8, 0.6],
  [41, 48, 1.2, 0.8], [46, 20, 0.7, 0.5], [52, 65, 1.5, 0.9], [57, 12, 0.9, 0.6],
  [61, 35, 1.1, 0.7], [65, 55, 0.8, 0.5], [70, 6, 1.3, 0.8], [74, 42, 0.7, 0.4],
  [78, 25, 1.6, 0.9], [83, 58, 0.9, 0.6], [88, 15, 1.1, 0.7], [92, 38, 0.8, 0.5],
  [96, 10, 1.2, 0.8], [6, 50, 0.9, 0.6], [12, 70, 1.3, 0.8], [24, 78, 0.8, 0.5],
  [33, 85, 1.1, 0.7], [44, 72, 0.7, 0.4], [55, 80, 1.4, 0.9], [63, 90, 0.9, 0.6],
  [72, 75, 1.2, 0.7], [85, 82, 0.8, 0.5], [95, 68, 1.1, 0.6], [2, 90, 1.3, 0.8],
] as const;

function StarField() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {STARS.map(([x, y, r, o], i) => (
        <circle key={i} cx={x} cy={y} r={r * 0.18} fill="white" opacity={o} />
      ))}
    </svg>
  );
}

function PortalCard({
  href,
  label,
  description,
  icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center gap-3 rounded-lg border border-veil-line bg-background-deep/40 px-6 py-8 text-center transition-colors hover:border-veil-amber/50 hover:bg-background-deep/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-veil-amber"
    >
      <span className="text-veil-amber/80 transition-colors group-hover:text-veil-amber-soft">
        {icon}
      </span>
      <span className="font-display text-lg tracking-wide text-foreground">
        {label}
      </span>
      <span className="text-sm text-muted">{description}</span>
    </Link>
  );
}

function EyeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M2 16C2 16 8 7 16 7C24 7 30 16 30 16C30 16 24 25 16 25C8 25 2 16 2 16Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="16" cy="16" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="4" y1="26" x2="28" y2="6" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

function NodeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="24" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="16" cy="24" r="2.4" stroke="currentColor" strokeWidth="1.2" />
      <line x1="10" y1="9" x2="22" y2="9.5" stroke="currentColor" strokeWidth="0.9" />
      <line x1="9" y1="10" x2="15" y2="22" stroke="currentColor" strokeWidth="0.9" />
      <line x1="23" y1="11" x2="17" y2="22" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 9C13.5 7 9 6.5 5 7.5V23C9 22 13.5 22.5 16 24.5C18.5 22.5 23 22 27 23V7.5C23 6.5 18.5 7 16 9Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line x1="16" y1="9" x2="16" y2="24.5" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}
