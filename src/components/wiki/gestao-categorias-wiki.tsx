"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  criarCategoriaWiki,
  atualizarCategoriaWiki,
  apagarCategoriaWiki,
} from "@/lib/wiki/actions";
import type { WikiCategoria } from "@/lib/wiki/types";

export function GestaoCategoriasWiki({
  categorias,
}: {
  categorias: WikiCategoria[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);

  const [nomeNovo, setNomeNovo] = useState("");
  const [aCriar, setACriar] = useState(false);

  const [idEmEdicao, setIdEmEdicao] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [ordemEdicao, setOrdemEdicao] = useState(0);
  const [aGuardar, setAGuardar] = useState(false);

  const categoriasOrdenadas = [...categorias].sort((a, b) => a.ordem - b.ordem);
  const proximaOrdem =
    categoriasOrdenadas.length > 0
      ? Math.max(...categoriasOrdenadas.map((c) => c.ordem)) + 1
      : 0;

  async function onCriar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!nomeNovo.trim()) {
      setErro("A categoria precisa de um nome.");
      return;
    }
    setACriar(true);
    const resultado = await criarCategoriaWiki(nomeNovo, proximaOrdem);
    setACriar(false);

    if ("erro" in resultado) {
      setErro(resultado.erro);
      return;
    }
    setNomeNovo("");
    router.refresh();
  }

  function iniciarEdicao(categoria: WikiCategoria) {
    setIdEmEdicao(categoria.id);
    setNomeEdicao(categoria.nome);
    setOrdemEdicao(categoria.ordem);
    setErro(null);
  }

  async function onGuardarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!idEmEdicao) return;
    setErro(null);

    if (!nomeEdicao.trim()) {
      setErro("A categoria precisa de um nome.");
      return;
    }

    setAGuardar(true);
    const resultado = await atualizarCategoriaWiki(idEmEdicao, nomeEdicao, ordemEdicao);
    setAGuardar(false);

    if ("erro" in resultado) {
      setErro(resultado.erro);
      return;
    }
    setIdEmEdicao(null);
    router.refresh();
  }

  async function onApagar(categoria: WikiCategoria) {
    if (
      !confirm(
        `Apagar a categoria "${categoria.nome}"? Só é possível se não tiver páginas.`
      )
    ) {
      return;
    }
    setErro(null);
    const resultado = await apagarCategoriaWiki(categoria.id);
    if (resultado.erro) {
      setErro(resultado.erro);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {erro && (
        <p className="rounded-md border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {erro}
        </p>
      )}

      <div className="overflow-hidden rounded-md border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Ordem</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {categoriasOrdenadas.map((categoria) => (
              <tr key={categoria.id} className="border-t border-neutral-800">
                {idEmEdicao === categoria.id ? (
                  <td colSpan={3} className="px-4 py-3">
                    <form onSubmit={onGuardarEdicao} className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={nomeEdicao}
                        onChange={(e) => setNomeEdicao(e.target.value)}
                        className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm"
                        autoFocus
                      />
                      <input
                        type="number"
                        value={ordemEdicao}
                        onChange={(e) => setOrdemEdicao(Number(e.target.value))}
                        className="w-20 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm"
                        title="Ordem"
                      />
                      <button
                        type="submit"
                        disabled={aGuardar}
                        className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm text-neutral-900 hover:bg-white disabled:opacity-60"
                      >
                        {aGuardar ? "A guardar…" : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIdEmEdicao(null)}
                        className="text-sm text-neutral-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-2 text-neutral-100">{categoria.nome}</td>
                    <td className="px-4 py-2 text-neutral-400">{categoria.ordem}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(categoria)}
                        className="mr-3 text-sm text-neutral-400 hover:text-white"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onApagar(categoria)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Apagar
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {categoriasOrdenadas.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-neutral-500">
                  Ainda não há categorias.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={onCriar}
        className="flex flex-wrap items-center gap-2 rounded-md border border-neutral-800 p-4"
      >
        <label className="text-sm text-neutral-300">Nova categoria:</label>
        <input
          type="text"
          value={nomeNovo}
          onChange={(e) => setNomeNovo(e.target.value)}
          placeholder="Nome da categoria"
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={aCriar}
          className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm text-neutral-900 hover:bg-white disabled:opacity-60"
        >
          {aCriar ? "A criar…" : "Criar categoria"}
        </button>
      </form>
    </div>
  );
}
