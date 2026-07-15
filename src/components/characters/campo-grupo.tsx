"use client";

import { useEffect, useState } from "react";
import { listarGrupos } from "@/lib/relations/groups-actions";
import type { Group } from "@/lib/characters/types";

type Props = {
  /** group_id atual, ou "" (nenhum), ou "outro" (pedido pendente). */
  valorSelecionado: string;
  onChangeSelecionado: (valor: string) => void;
  /** Texto do pedido de grupo novo, usado quando valorSelecionado === "outro". */
  valorPedidoOutro: string;
  onChangePedidoOutro: (valor: string) => void;
  onBlurCampo?: () => void;
};

/**
 * Select de "Grupo a que pertence", carregado dinamicamente da tabela
 * public.groups (gerida pelo CRIADOR em /admin/mapa) em vez de uma lista
 * fixa no código — permite grupos novos aparecerem automaticamente sem
 * precisar de alterar o código da ficha.
 *
 * "Nenhum" grava group_id = null. "Outro" mostra um campo de texto livre
 * (grupo_pedido_outro); esse grupo só é criado de facto em public.groups
 * quando o CRIADOR aprova a ficha (ver aprovarFicha).
 */
export function CampoGrupo({
  valorSelecionado,
  onChangeSelecionado,
  valorPedidoOutro,
  onChangePedidoOutro,
  onBlurCampo,
}: Props) {
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [aCarregar, setACarregar] = useState(true);

  useEffect(() => {
    let cancelado = false;
    listarGrupos().then((data) => {
      if (!cancelado) {
        setGrupos(data);
        setACarregar(false);
      }
    });
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div>
      <div>
        <label className="block text-sm text-neutral-300">
          Grupo a que pertence
        </label>
        <select
          name="group_id"
          value={valorSelecionado}
          onChange={(e) => {
            onChangeSelecionado(e.target.value);
            onBlurCampo?.();
          }}
          disabled={aCarregar}
          className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400 disabled:opacity-60"
        >
          <option value="">Nenhum</option>
          {grupos.map((grupo) => (
            <option key={grupo.id} value={grupo.id}>
              {grupo.nome}
            </option>
          ))}
          <option value="outro">Outro (pedir um grupo novo)</option>
        </select>
        <p className="mt-1 text-xs text-neutral-500">
          Dica de DM: se não estiveres familiarizado com a história, não
          te aconselho a escolheres um grupo que não conheças.
        </p>
      </div>

      {valorSelecionado === "outro" && (
        <div className="mt-4">
          <label className="block text-sm text-neutral-300">
            Nome do grupo pedido
          </label>
          <input
            type="text"
            name="grupo_pedido_outro"
            value={valorPedidoOutro}
            onChange={(e) => onChangePedidoOutro(e.target.value)}
            onBlur={onBlurCampo}
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
          <p className="mt-1 text-xs text-neutral-500">
            O grupo só é criado de facto quando o CRIADOR aprovar a
            ficha, entretanto fica como pedido.
          </p>
        </div>
      )}
    </div>
  );
}
