"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ESTADO_LABELS } from "@/lib/characters/types";

export function FiltrosFichas() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`/fichas?${params.toString()}`);
    });
  }

  function handleSubmitBusca(e: React.FormEvent) {
    e.preventDefault();
    updateParam("q", q);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <form onSubmit={handleSubmitBusca} className="min-w-[200px] flex-1">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquisar por nome, campanha ou dono…"
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </form>

      <select
        defaultValue={searchParams.get("estado") ?? ""}
        onChange={(e) => updateParam("estado", e.target.value)}
        className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
      >
        <option value="">Todos os estados</option>
        {Object.entries(ESTADO_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get("dono") ?? "todos"}
        onChange={(e) => updateParam("dono", e.target.value)}
        className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
      >
        <option value="todos">Todas as fichas</option>
        <option value="minhas">Só as minhas</option>
      </select>

      {isPending && <span className="text-xs text-neutral-500">A filtrar…</span>}
    </div>
  );
}
