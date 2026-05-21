'use client'
// src/app/dashboard/pipeline/page.tsx
import { useEffect, useState, useCallback } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { Clock, AlertCircle } from 'lucide-react'
import type { PipelineColuna, PipelineCard } from '@/types'

// ── Card individual ──────────────────────────────────────
function Card({ card }: { card: PipelineCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const nome = card.contato?.nome || card.contato?.telefone || card.titulo || '–'
  const cores = { baixa: '#1D9E75', normal: '#888780', alta: '#BA7517', urgente: '#E24B4A' }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-black/[0.06] rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-black/10 transition-colors"
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-[#E1F5EE] flex items-center justify-center text-[9px] font-medium text-[#085041] flex-shrink-0 mt-0.5">
          {nome.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <p className="text-xs font-medium leading-tight">{nome}</p>
      </div>

      {card.contato?.interesse && (
        <p className="text-[10px] text-gray-500 mb-2">{card.contato.interesse}</p>
      )}

      <div className="flex items-center justify-between mt-1">
        {card.prazo && (
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Clock size={9} /> {new Date(card.prazo).toLocaleDateString('pt-BR')}
          </span>
        )}
        <div
          className="w-2 h-2 rounded-full ml-auto"
          style={{ background: cores[card.prioridade] }}
        />
      </div>
    </div>
  )
}

// ── Coluna ───────────────────────────────────────────────
function Coluna({ coluna }: { coluna: PipelineColuna }) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.id })
  const cards = coluna.cards || []

  return (
    <div className="w-48 flex-shrink-0 flex flex-col">
      <div
        className="flex items-center justify-between px-3 py-2 rounded-t-xl text-xs font-medium"
        style={{ background: coluna.cor, color: coluna.cor ? '#333' : undefined }}
      >
        <span>{coluna.nome}</span>
        <span className="bg-black/10 rounded-full px-1.5 py-0.5 text-[10px]">{cards.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-24 rounded-b-xl p-2 space-y-2 transition-colors ${
          isOver ? 'bg-[#E1F5EE]' : 'bg-black/[0.03]'
        }`}
      >
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => <Card key={card.id} card={card} />)}
        </SortableContext>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────
export default function PipelinePage() {
  const [colunas, setColunas] = useState<PipelineColuna[]>([])
  const [carregando, setCarregando] = useState(true)
  const [cardAtivo, setCardAtivo] = useState<PipelineCard | null>(null)
  const { clinica } = useStore()
  const supabase = createClient()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const carregar = useCallback(async () => {
    if (!clinica) return
    const { data: cols } = await supabase
      .from('pipeline_colunas')
      .select('*')
      .eq('clinica_id', clinica.id)
      .order('ordem')

    const { data: cards } = await supabase
      .from('pipeline_cards')
      .select('*, contato:contatos(nome, telefone, interesse)')
      .eq('clinica_id', clinica.id)
      .eq('arquivado', false)
      .order('ordem')

    if (cols) {
      setColunas(cols.map(col => ({
        ...col,
        cards: (cards || []).filter(c => c.coluna_id === col.id),
      })))
    }
    setCarregando(false)
  }, [clinica])

  useEffect(() => { carregar() }, [carregar])

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setCardAtivo(null)
    if (!over || active.id === over.id) return

    // over.id pode ser coluna ou outro card — determinar coluna destino
    const colunaDestino = colunas.find(col =>
      col.id === over.id || col.cards?.some(c => c.id === over.id)
    )
    if (!colunaDestino) return

    const cardId = active.id as string

    // Atualizar localmente (otimista)
    setColunas(prev => prev.map(col => ({
      ...col,
      cards: col.cards?.filter(c => c.id !== cardId) || [],
    })).map(col => col.id === colunaDestino.id ? {
      ...col,
      cards: [...(col.cards || []), prev.flatMap(c => c.cards || []).find(c => c.id === cardId)!],
    } : col))

    // Persistir no banco
    await supabase
      .from('pipeline_cards')
      .update({ coluna_id: colunaDestino.id })
      .eq('id', cardId)

    // Registrar no histórico
    await supabase.from('pipeline_historico').insert({
      card_id: cardId,
      clinica_id: clinica!.id,
      coluna_destino: colunaDestino.id,
      automatico: false,
    })
  }

  function onDragStart(event: DragStartEvent) {
    const card = colunas.flatMap(c => c.cards || []).find(c => c.id === event.active.id)
    setCardAtivo(card || null)
  }

  if (carregando) {
    return <div className="flex-1 flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-[#1D9E75] border-t-transparent animate-spin" />
    </div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="h-11 flex items-center px-4 border-b border-black/[0.06] bg-white flex-shrink-0">
        <span className="text-sm font-medium">Pipeline de pacientes</span>
        <span className="ml-2 text-xs text-gray-400">
          {colunas.reduce((acc, c) => acc + (c.cards?.length || 0), 0)} leads ativos
        </span>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex gap-3 h-full min-w-max">
            {colunas.map(col => <Coluna key={col.id} coluna={col} />)}
          </div>
          <DragOverlay>
            {cardAtivo && <Card card={cardAtivo} />}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
