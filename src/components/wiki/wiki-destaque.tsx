// Divide `texto` nas ocorrências de `termo` (case-insensitive, sem
// acentuação) e devolve nós React com as ocorrências envolvidas em
// <mark>. Usado tanto na wiki (/wiki, /wiki/[slug]) como na contagem de
// resultados da pesquisa (ver wiki-sidebar.tsx para a contagem).

function removerAcentos(valor: string): string {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escaparRegex(valor: string): string {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function contarOcorrencias(texto: string, termo: string): number {
  const termoLimpo = removerAcentos(termo).trim();
  if (!termoLimpo) return 0;

  const textoLimpo = removerAcentos(texto);
  const regex = new RegExp(escaparRegex(termoLimpo), "gi");
  return (textoLimpo.match(regex) ?? []).length;
}

export function TextoComDestaque({
  texto,
  termo,
}: {
  texto: string;
  termo?: string | null;
}) {
  if (!termo || !termo.trim()) {
    return <>{texto}</>;
  }

  const termoLimpo = removerAcentos(termo).trim();
  const textoLimpo = removerAcentos(texto);
  const regex = new RegExp(`(${escaparRegex(termoLimpo)})`, "gi");

  // Recorta o texto ORIGINAL (com acentos) usando os índices encontrados
  // no texto sem acentos, para preservar o texto exibido tal como está
  // guardado, mesmo que a pesquisa ignore acentuação.
  const partes: React.ReactNode[] = [];
  let ultimoIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(textoLimpo)) !== null) {
    const inicio = match.index;
    const fim = inicio + match[0].length;

    if (inicio > ultimoIndex) {
      partes.push(texto.slice(ultimoIndex, inicio));
    }
    partes.push(
      <mark
        key={inicio}
        className="rounded bg-yellow-300 px-0.5 text-neutral-900"
      >
        {texto.slice(inicio, fim)}
      </mark>
    );
    ultimoIndex = fim;
  }

  if (ultimoIndex < texto.length) {
    partes.push(texto.slice(ultimoIndex));
  }

  return <>{partes}</>;
}
