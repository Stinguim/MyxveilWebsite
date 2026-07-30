// Parser simples de conteúdo para wiki_pages.conteudo / guide_pages.conteudo.
//
// O texto continua a ser guardado como texto simples (sem editor rich
// text completo). Duas sintaxes especiais são reconhecidas, ambas
// inspiradas em Markdown mas com suporte mínimo (não é um parser de
// Markdown genérico):
//
//   ![legenda](url)     -> imagem, pode aparecer a meio ou no fim do texto
//   # Título             -> título grande (h2)
//   ## Título            -> título médio (h3)
//   ### Título           -> título pequeno (h4)
//
// Uma linha só é tratada como título se começar a linha com "#", "##"
// ou "###" seguido de espaço — "#" a meio de uma frase normal não é
// afetado. Tudo o resto do texto mantém-se exatamente como está
// guardado (espaços, quebras de linha), renderizado com
// whitespace-pre-wrap, igual ao comportamento anterior.
//
// Usado tanto por /wiki como por /guia — ver ConteudoComImagens.

export type BlocoConteudo =
  | { tipo: "texto"; valor: string }
  | { tipo: "imagem"; url: string; legenda: string | null }
  | { tipo: "titulo"; nivel: 1 | 2 | 3; valor: string };

// Aceita apenas http(s) — evita "javascript:" ou outros esquemas
// inseguros acabarem num atributo src.
const REGEX_IMAGEM = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;

// Linha de título: até 3 "#" no início da linha, um espaço, e o texto.
// "^" com a flag "m" ancora ao início de cada linha, não só do texto.
const REGEX_TITULO = /^(#{1,3})[ \t]+(.+)$/gm;

function parseTitulosEImagens(texto: string): BlocoConteudo[] {
  const blocos: BlocoConteudo[] = [];
  let ultimoIndex = 0;
  let match: RegExpExecArray | null;

  REGEX_TITULO.lastIndex = 0;
  while ((match = REGEX_TITULO.exec(texto)) !== null) {
    const [linhaCompleta, cardinais, conteudoTitulo] = match;
    const inicio = match.index;

    if (inicio > ultimoIndex) {
      blocos.push({ tipo: "texto", valor: texto.slice(ultimoIndex, inicio) });
    }

    blocos.push({
      tipo: "titulo",
      nivel: cardinais.length as 1 | 2 | 3,
      valor: conteudoTitulo.trim(),
    });

    ultimoIndex = inicio + linhaCompleta.length;
  }

  if (ultimoIndex < texto.length) {
    blocos.push({ tipo: "texto", valor: texto.slice(ultimoIndex) });
  }

  return blocos;
}

export function parseConteudo(conteudo: string): BlocoConteudo[] {
  const blocos: BlocoConteudo[] = [];
  let ultimoIndex = 0;
  let match: RegExpExecArray | null;

  REGEX_IMAGEM.lastIndex = 0;
  while ((match = REGEX_IMAGEM.exec(conteudo)) !== null) {
    const [textoCompleto, legendaBruta, url] = match;
    const inicio = match.index;

    if (inicio > ultimoIndex) {
      blocos.push(...parseTitulosEImagens(conteudo.slice(ultimoIndex, inicio)));
    }

    blocos.push({
      tipo: "imagem",
      url,
      legenda: legendaBruta.trim() || null,
    });

    ultimoIndex = inicio + textoCompleto.length;
  }

  if (ultimoIndex < conteudo.length) {
    blocos.push(...parseTitulosEImagens(conteudo.slice(ultimoIndex)));
  }

  return blocos;
}
