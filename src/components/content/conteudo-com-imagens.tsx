import { parseConteudo } from "@/lib/content/conteudo-com-imagens";

/**
 * Renderiza `conteudo` (texto simples com sintaxe mínima opcional —
 * ![legenda](url) para imagens, # / ## / ### para títulos) como uma
 * sequência de blocos: texto normal (whitespace-pre-wrap, igual ao
 * comportamento anterior), imagens (com legenda por baixo, se houver) e
 * títulos (três tamanhos).
 *
 * `renderTexto` é opcional e permite à wiki continuar a aplicar
 * TextoComDestaque só aos blocos de texto e título (as imagens não são
 * pesquisadas/destacadas). Sem essa prop, o texto é apresentado tal
 * como está.
 */
export function ConteudoComImagens({
  conteudo,
  renderTexto,
}: {
  conteudo: string;
  renderTexto?: (texto: string) => React.ReactNode;
}) {
  const blocos = parseConteudo(conteudo);

  return (
    <div className="space-y-4">
      {blocos.map((bloco, index) => {
        if (bloco.tipo === "imagem") {
          return (
            <figure key={index} className="my-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bloco.url}
                alt={bloco.legenda ?? ""}
                className="max-w-full rounded-md border border-neutral-800"
              />
              {bloco.legenda && (
                <figcaption className="mt-1 text-sm text-neutral-500">
                  {bloco.legenda}
                </figcaption>
              )}
            </figure>
          );
        }

        if (bloco.tipo === "titulo") {
          const texto = renderTexto ? renderTexto(bloco.valor) : bloco.valor;
          if (bloco.nivel === 1) {
            return (
              <h2
                key={index}
                className="-mb-2 text-xl font-semibold text-neutral-100"
              >
                {texto}
              </h2>
            );
          }
          if (bloco.nivel === 2) {
            return (
              <h3
                key={index}
                className="-mb-2 text-lg font-semibold text-neutral-100"
              >
                {texto}
              </h3>
            );
          }
          return (
            <h4
              key={index}
              className="-mb-2 text-base font-semibold text-neutral-200"
            >
              {texto}
            </h4>
          );
        }

        // Blocos de texto vazios (ex: entre duas imagens/títulos
        // seguidos) não precisam de nó próprio.
        if (bloco.valor === "") return null;

        return (
          <div key={index} className="whitespace-pre-wrap text-neutral-300">
            {renderTexto ? renderTexto(bloco.valor) : bloco.valor}
          </div>
        );
      })}
    </div>
  );
}
