// Parser simples de conteúdo para wiki_pages.conteudo / guide_pages.conteudo.
//
// O texto continua a ser guardado como texto simples (sem editor rich
// text). A única sintaxe especial suportada é markdown de imagem:
//
//   ![legenda](url)
//
// que pode aparecer a meio ou no fim do texto. Tudo o resto do texto
// mantém-se exatamente como está guardado (espaços, quebras de linha),
// renderizado com whitespace-pre-wrap, igual ao comportamento anterior.
//
// Usado tanto por /wiki como por /guia — ver ConteudoComImagens.

export type BlocoConteudo =
  | { tipo: "texto"; valor: string }
  | { tipo: "imagem"; url: string; legenda: string | null };

// Aceita apenas http(s) — evita "javascript:" ou outros esquemas
// inseguros acabarem num atributo src.
const REGEX_IMAGEM = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;

export function parseConteudo(conteudo: string): BlocoConteudo[] {
  const blocos: BlocoConteudo[] = [];
  let ultimoIndex = 0;
  let match: RegExpExecArray | null;

  REGEX_IMAGEM.lastIndex = 0;
  while ((match = REGEX_IMAGEM.exec(conteudo)) !== null) {
    const [textoCompleto, legendaBruta, url] = match;
    const inicio = match.index;

    if (inicio > ultimoIndex) {
      blocos.push({ tipo: "texto", valor: conteudo.slice(ultimoIndex, inicio) });
    }

    blocos.push({
      tipo: "imagem",
      url,
      legenda: legendaBruta.trim() || null,
    });

    ultimoIndex = inicio + textoCompleto.length;
  }

  if (ultimoIndex < conteudo.length) {
    blocos.push({ tipo: "texto", valor: conteudo.slice(ultimoIndex) });
  }

  return blocos;
}
