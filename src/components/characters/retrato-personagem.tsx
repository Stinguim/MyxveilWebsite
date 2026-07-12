// eslint-disable-next-line @next/next/no-img-element -- URLs vêm do
// Storage do Supabase (domínio externo), sem next/image configurado
// para esse domínio; <img> simples evita ter de mexer em next.config.

function RetratoDefault({ className }: { className?: string }) {
  // Silhueta simples e neutra — não tenta adivinhar género/espécie da
  // personagem, é só um placeholder visual até haver upload.
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Sem retrato"
    >
      <rect width="100" height="100" fill="#262626" />
      <circle cx="50" cy="38" r="18" fill="#404040" />
      <path d="M20 92c0-20 13-34 30-34s30 14 30 34" fill="#404040" />
    </svg>
  );
}

export function RetratoPersonagem({
  url,
  nome,
  size = "md",
}: {
  url: string | null;
  nome: string;
  size?: "sm" | "md" | "lg";
}) {
  const dimensoes = {
    sm: "h-12 w-12",
    md: "h-20 w-20",
    lg: "h-40 w-40",
  }[size];

  return (
    <div
      className={`${dimensoes} shrink-0 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`Retrato de ${nome}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <RetratoDefault className="h-full w-full" />
      )}
    </div>
  );
}
