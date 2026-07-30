"use client";

/**
 * Botões "Título", "Subtítulo" e "Título pequeno" para colocar ao lado
 * de UploadImagemConteudo, por cima do <textarea> de conteúdo. Inserem
 * a marca de título (#, ## ou ###) no início da linha atual do cursor,
 * sem exigir que o CRIADOR saiba a sintaxe de cor.
 *
 * Mesma convenção de `textareaRef` que UploadImagemConteudo — tem de
 * apontar para o <textarea> do campo "conteudo".
 */
export function InserirTituloConteudo({
  textareaRef,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  function inserirTitulo(nivel: 1 | 2 | 3) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const marca = "#".repeat(nivel) + " ";
    const inicio = textarea.selectionStart ?? textarea.value.length;
    const fim = textarea.selectionEnd ?? textarea.value.length;
    const valor = textarea.value;

    // Encontra o início da linha onde está o cursor, para colocar a
    // marca no início da linha (não no meio de uma frase).
    const inicioLinha = valor.lastIndexOf("\n", inicio - 1) + 1;
    const textoSelecionado = valor.slice(inicio, fim);

    const antes = valor.slice(0, inicioLinha);
    const restoLinhaEDepois = valor.slice(inicioLinha);

    // Remove uma marca de título já existente no início da linha, se
    // houver, para não acumular "# ## texto" ao clicar duas vezes.
    const semMarcaAntiga = restoLinhaEDepois.replace(/^#{1,3}[ \t]+/, "");

    const novoValor = antes + marca + semMarcaAntiga;
    textarea.value = novoValor;

    const novaPosicaoCursor =
      antes.length + marca.length + (textoSelecionado ? textoSelecionado.length : 0);

    textarea.focus();
    requestAnimationFrame(() => {
      textarea.setSelectionRange(novaPosicaoCursor, novaPosicaoCursor);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => inserirTitulo(1)}
        className="rounded-md border border-neutral-700 px-2 py-1 text-sm text-neutral-300 hover:bg-neutral-900"
        title="Título grande"
      >
        Título
      </button>
      <button
        type="button"
        onClick={() => inserirTitulo(2)}
        className="rounded-md border border-neutral-700 px-2 py-1 text-sm text-neutral-300 hover:bg-neutral-900"
        title="Subtítulo"
      >
        Subtítulo
      </button>
      <button
        type="button"
        onClick={() => inserirTitulo(3)}
        className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-900"
        title="Título pequeno"
      >
        Título pequeno
      </button>
    </div>
  );
}
