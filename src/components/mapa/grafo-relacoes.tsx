"use client";

import { useMemo, useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeDragHandler,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  corDaRelacao,
  idNoGrupo,
  idNoPersonagem,
  TIPO_RELACAO_LABEL,
  type CharacterRelation,
  type Group,
} from "@/lib/relations/types";
import {
  guardarPosicaoNo,
  type NodePosition,
  type TipoNoMapa,
} from "@/lib/relations/node-positions-actions";

export type PersonagemDoGrafo = {
  id: string;
  nome: string;
};

type Props = {
  personagens: PersonagemDoGrafo[];
  grupos: Group[];
  relacoes: CharacterRelation[];
  /** Posições guardadas manualmente (drag do CRIADOR); sobrepõem o layout automático. */
  posicoesGuardadas?: NodePosition[];
  /**
   * true = permite arrastar os nós e persiste a posição ao largar
   * (só em /admin/mapa, para o CRIADOR). false = grafo só de leitura,
   * como em /mapa para jogadores.
   */
  podeArrastar?: boolean;
  /** Chamado ao clicar num nó de personagem — para abrir a ficha resumida. */
  onClickPersonagem?: (characterId: string) => void;
  /** Chamado ao clicar numa aresta — usado em /admin/mapa para oferecer apagar. */
  onClickAresta?: (relacao: CharacterRelation) => void;
};

// Layout determinístico simples (sem dependência de d3-force): grupos
// numa linha no topo, personagens distribuídas por baixo em grelha. Não é
// tão orgânico como um layout de forças, mas é estável entre renders e
// não precisa de mais nenhuma biblioteca. Usado como fallback para
// qualquer nó que ainda não tenha uma posição guardada manualmente.
function calcularLayout(
  personagens: PersonagemDoGrafo[],
  grupos: Group[],
  posicoesPorNoId: Map<string, { x: number; y: number }>
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];

  const espacamentoGrupo = 220;
  grupos.forEach((grupo, i) => {
    const noId = idNoGrupo(grupo.id);
    nodes.push({
      id: noId,
      position: posicoesPorNoId.get(noId) ?? { x: i * espacamentoGrupo, y: 0 },
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
    const noId = idNoPersonagem(personagem.id);
    nodes.push({
      id: noId,
      position:
        posicoesPorNoId.get(noId) ?? {
          x: col * espacamentoX,
          y: offsetY + linha * espacamentoY,
        },
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

/** Extrai (tipo, ref_id) a partir do id de nó "char:<uuid>" ou "grupo:<uuid>". */
function tipoERefDoNoId(noId: string): { tipo: TipoNoMapa; refId: string } | null {
  if (noId.startsWith("char:")) {
    return { tipo: "personagem", refId: noId.replace("char:", "") };
  }
  if (noId.startsWith("grupo:")) {
    return { tipo: "grupo", refId: noId.replace("grupo:", "") };
  }
  return null;
}

export function GrafoRelacoes({
  personagens,
  grupos,
  relacoes,
  posicoesGuardadas = [],
  podeArrastar = false,
  onClickPersonagem,
  onClickAresta,
}: Props) {
  const posicoesPorNoId = useMemo(() => {
    const mapa = new Map<string, { x: number; y: number }>();
    for (const p of posicoesGuardadas) {
      const noId = p.tipo === "personagem" ? idNoPersonagem(p.ref_id) : idNoGrupo(p.ref_id);
      mapa.set(noId, { x: p.x, y: p.y });
    }
    return mapa;
  }, [posicoesGuardadas]);

  const { nodes } = useMemo(
    () => calcularLayout(personagens, grupos, posicoesPorNoId),
    [personagens, grupos, posicoesPorNoId]
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

        const cor = corDaRelacao(relacao);

        return {
          id: relacao.id,
          source,
          target,
          label,
          animated: relacao.tipo === "romance",
          style: { stroke: cor },
          labelStyle: { fill: "#e5e5e5", fontSize: 11 },
          labelBgStyle: { fill: "#171717" },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: cor,
          },
        } satisfies Edge;
      }),
    [relacoes]
  );

  // Evita disparar guardarPosicaoNo() repetidamente durante o próprio
  // gesto de arrastar — react-flow chama onNodeDrag a cada frame; só
  // queremos persistir no fim, em onNodeDragStop.
  const aArrastarRef = useRef(false);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // Evita interpretar o fim de um drag como um clique (abrir ficha).
      if (aArrastarRef.current) return;
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

  const handleNodeDragStart: NodeDragHandler = useCallback(() => {
    aArrastarRef.current = true;
  }, []);

  const handleNodeDragStop: NodeDragHandler = useCallback((_, node) => {
    aArrastarRef.current = false;
    const alvo = tipoERefDoNoId(node.id);
    if (!alvo) return;
    void guardarPosicaoNo(alvo.tipo, alvo.refId, node.position.x, node.position.y);
  }, []);

  return (
    <div style={{ height: 600 }} className="rounded-md border border-neutral-800">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesDraggable={podeArrastar}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onNodeDragStart={podeArrastar ? handleNodeDragStart : undefined}
        onNodeDragStop={podeArrastar ? handleNodeDragStop : undefined}
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
