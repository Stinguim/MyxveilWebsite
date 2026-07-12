"use client";

import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  idNoGrupo,
  idNoPersonagem,
  TIPO_RELACAO_COR,
  TIPO_RELACAO_LABEL,
  type CharacterRelation,
  type Group,
} from "@/lib/relations/types";

export type PersonagemDoGrafo = {
  id: string;
  nome: string;
};

type Props = {
  personagens: PersonagemDoGrafo[];
  grupos: Group[];
  relacoes: CharacterRelation[];
  /** Chamado ao clicar num nó de personagem — para abrir a ficha resumida. */
  onClickPersonagem?: (characterId: string) => void;
  /** Chamado ao clicar numa aresta — usado em /admin/mapa para oferecer apagar. */
  onClickAresta?: (relacao: CharacterRelation) => void;
};

// Layout determinístico simples (sem dependência de d3-force): grupos
// numa linha no topo, personagens distribuídas por baixo em grelha. Não é
// tão orgânico como um layout de forças, mas é estável entre renders e
// não precisa de mais nenhuma biblioteca — o utilizador pode sempre
// arrastar os nós manualmente depois (react-flow trata disso de base).
function calcularLayout(
  personagens: PersonagemDoGrafo[],
  grupos: Group[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];

  const espacamentoGrupo = 220;
  grupos.forEach((grupo, i) => {
    nodes.push({
      id: idNoGrupo(grupo.id),
      position: { x: i * espacamentoGrupo, y: 0 },
      data: { label: grupo.nome },
      style: {
        background: "#292524",
        border: "2px solid #a3a3a3",
        borderRadius: 12,
        padding: 10,
        fontWeight: 600,
        color: "#fafafa",
        width: 160,
        textAlign: "center" as const,
      },
    });
  });

  const colunas = Math.max(1, Math.ceil(Math.sqrt(personagens.length)));
  const espacamentoX = 180;
  const espacamentoY = 100;
  const offsetY = 160;

  personagens.forEach((personagem, i) => {
    const col = i % colunas;
    const linha = Math.floor(i / colunas);
    nodes.push({
      id: idNoPersonagem(personagem.id),
      position: { x: col * espacamentoX, y: offsetY + linha * espacamentoY },
      data: { label: personagem.nome },
      style: {
        background: "#171717",
        border: "1px solid #525252",
        borderRadius: 8,
        padding: 8,
        fontSize: 13,
        color: "#e5e5e5",
        width: 140,
        textAlign: "center" as const,
      },
    });
  });

  return { nodes, edges: [] };
}

export function GrafoRelacoes({
  personagens,
  grupos,
  relacoes,
  onClickPersonagem,
  onClickAresta,
}: Props) {
  const { nodes } = useMemo(
    () => calcularLayout(personagens, grupos),
    [personagens, grupos]
  );

  const edges: Edge[] = useMemo(
    () =>
      relacoes.map((relacao) => {
        const source = idNoPersonagem(relacao.character_a_id);
        const target = relacao.character_b_id
          ? idNoPersonagem(relacao.character_b_id)
          : idNoGrupo(relacao.group_b_id!);

        const label =
          relacao.tipo === "outro" && relacao.tipo_outro
            ? relacao.tipo_outro
            : TIPO_RELACAO_LABEL[relacao.tipo];

        return {
          id: relacao.id,
          source,
          target,
          label,
          animated: relacao.tipo === "romance",
          style: { stroke: TIPO_RELACAO_COR[relacao.tipo] },
          labelStyle: { fill: "#e5e5e5", fontSize: 11 },
          labelBgStyle: { fill: "#171717" },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: TIPO_RELACAO_COR[relacao.tipo],
          },
        } satisfies Edge;
      }),
    [relacoes]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id.startsWith("char:") && onClickPersonagem) {
        onClickPersonagem(node.id.replace("char:", ""));
      }
    },
    [onClickPersonagem]
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (!onClickAresta) return;
      const relacao = relacoes.find((r) => r.id === edge.id);
      if (relacao) onClickAresta(relacao);
    },
    [relacoes, onClickAresta]
  );

  return (
    <div style={{ height: 600 }} className="rounded-md border border-neutral-800">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#404040" gap={24} />
        <Controls />
        <MiniMap
          nodeColor={(n) => (n.id.startsWith("grupo:") ? "#a3a3a3" : "#525252")}
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>
    </div>
  );
}
