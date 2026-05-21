'use client'
// src/app/dashboard/agenda/page.tsx
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import {
  format, startOfWeek, addDays, addWeeks, subWeeks,
  isSameDay, parseISO, isToday, setHours, setMinutes
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react'
import type { Agendamento, Usuario } from '@/types'
import ModalAgendamento from '@/components/agenda/ModalAgendamento'

// Horas exibidas na grade (08h–19h)
const HORAS = Array.from({ length: 12 }, (_, i) => i + 8)
const SLOT_HEIGHT = 56 // px por hora

const CORES_DENTISTA = [
  { bg: '#E1F5EE', border: '#1D9E75', text: '#085041' },
  { bg: '#E6F1FB', border: '#185FA5', text: '#042C53' },
  { bg: '#EEEDFE', border: '#534AB7', text: '#26215C' },
  { bg: '#FAEEDA', border: '#BA7517', text: '#633806' },
]

function corDentista(idx: number) {
  return CORES_DENTISTA[idx % CORES_DENTISTA.length]
}

function posicaoBloco(inicio: string, fim: string) {
  const d = parseISO(inicio)
  const f = parseISO(fim)
  const horaInicio = d.getHours() + d.getMinutes() / 60
  const horaFim = f.getHours() + f.getMinutes() / 60
  const top = (horaInicio - 8) * SLOT_HEIGHT
  const height = Math.max((horaFim - horaInicio) * SLOT_HEIGHT, 28)
  return { top, height }
}

export default function AgendaPage() {
  const [semanaBase, setSemanaBase] = useState(new Date())
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [dentistas, setDentistas] = useState<Usuario[]>([])
  const [dentistasFiltro, setDentistasFiltro] = useState<Set<string>>(new Set())
  const [modalAberto, setModalAberto] = useState(false)
  const [slotSelecionado, setSlotSelecionado] = useState<{ data: Date; dentista_id?: string } | null>(null)
  const [agSelecionado, setAgSelecionado] = useState<Agendamento | null>(null)
  const { clinica } = useStore()
  const supabase = createClient()

  // Dias da semana (segunda a sábado)
  const inicioSemana = startOfWeek(semanaBase, { weekStartsOn: 1 })
  const dias = Array.from({ length: 6 }, (_, i) => addDays(inicioSemana, i))

  const carregar = useCallback(async () => {
    if (!clinica) return
    const inicio = inicioSemana.toISOString()
    const fim = addDays(inicioSemana, 6).toISOString()

    const { data } = await supabase
      .from('agendamentos')
      .select(`
        *,
        contato:contatos(id, nome, telefone),
        dentista:usuarios!dentista_id(id, nome),
        procedimento:procedimentos(nome, cor)
      `)
      .eq('clinica_id', clinica.id)
      .gte('inicio', inicio)
      .lte('inicio', fim)
      .not('status', 'eq', 'cancelado')
      .order('inicio')

    setAgendamentos((data as Agendamento[]) || [])
  }, [clinica, inicioSemana])

  // Buscar dentistas
  useEffect(() => {
    if (!clinica) return
    supabase
      .from('usuarios')
      .select('id, nome, cargo')
      .eq('clinica_id', clinica.id)
      .in('cargo', ['dentista', 'admin'])
      .then(({ data }) => {
        setDentistas(data || [])
        setDentistasFiltro(new Set((data || []).map(d => d.id)))
      })
  }, [clinica])

  useEffect(() => { carregar() }, [carregar])

  function toggleDentista(id: string) {
    setDentistasFiltro(prev => {
      const novo = new Set(prev)
      novo.has(id) ? novo.delete(id) : novo.add(id)
      return novo
    })
  }

  function clicarSlot(dia: Date, hora: number, dentistaId?: string) {
    const data = setMinutes(setHours(dia, hora), 0)
    setSlotSelecionado({ data, dentista_id: dentistaId })
    setAgSelecionado(null)
    setModalAberto(true)
  }

  const agsFiltrados = agendamentos.filter(ag =>
    ag.dentista_id && dentistasFiltro.has(ag.dentista_id)
  )

  const totalHoje = agendamentos.filter(ag => isToday(parseISO(ag.inicio))).length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="h-11 flex items-center px-4 gap-3 border-b border-black/[0.06] bg-white flex-shrink-0">
        <span className="text-sm font-medium">Agenda</span>
        <span className="text-xs text-gray-400">{totalHoje} consultas hoje</span>
        <div className="flex-1" />

        {/* Navegação semana */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSemanaBase(subWeeks(semanaBase, 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => setSemanaBase(new Date())}
            className="px-2.5 h-7 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={() => setSemanaBase(addWeeks(semanaBase, 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <span className="text-xs text-gray-500 font-medium">
          {format(inicioSemana, "d 'de' MMMM", { locale: ptBR })} –{' '}
          {format(addDays(inicioSemana, 5), "d 'de' MMMM yyyy", { locale: ptBR })}
        </span>

        <button
          onClick={() => { setSlotSelecionado({ data: new Date() }); setAgSelecionado(null); setModalAberto(true) }}
          className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-[#1D9E75] text-white text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={13} /> Agendar
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: mini-cal + filtro dentistas */}
        <div className="w-44 border-r border-black/[0.06] bg-white flex-shrink-0 overflow-y-auto p-3">
          <MiniCal semanaBase={semanaBase} onSelectDia={setSemanaBase} />

          <div className="mt-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Dentistas</p>
            <div className="space-y-1.5">
              {dentistas.map((d, i) => {
                const cor = corDentista(i)
                const ativo = dentistasFiltro.has(d.id)
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDentista(d.id)}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-opacity"
                      style={{ background: cor.border, opacity: ativo ? 1 : 0.3 }}
                    />
                    <span className={`text-xs transition-opacity ${ativo ? 'text-gray-700' : 'text-gray-400'}`}>
                      {d.nome.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Grade semanal */}
        <div className="flex-1 overflow-auto">
          <div className="flex min-w-0" style={{ minWidth: 600 }}>
            {/* Coluna de horas */}
            <div className="w-12 flex-shrink-0">
              <div className="h-10" /> {/* espaço para cabeçalho de dias */}
              {HORAS.map(h => (
                <div key={h} className="flex items-start justify-end pr-2"
                  style={{ height: SLOT_HEIGHT }}>
                  <span className="text-[10px] text-gray-400 -mt-2">{h}:00</span>
                </div>
              ))}
            </div>

            {/* Dias */}
            {dias.map((dia, diaIdx) => {
              const agsNoDia = agsFiltrados.filter(ag => isSameDay(parseISO(ag.inicio), dia))
              const hoje = isToday(dia)
              return (
                <div key={dia.toISOString()} className="flex-1 border-l border-black/[0.04] min-w-0">
                  {/* Cabeçalho do dia */}
                  <div className={`h-10 flex flex-col items-center justify-center sticky top-0 z-10 bg-white border-b border-black/[0.04] ${hoje ? 'bg-[#E1F5EE]' : ''}`}>
                    <span className="text-[10px] text-gray-400">
                      {format(dia, 'EEE', { locale: ptBR }).toUpperCase()}
                    </span>
                    <span className={`text-sm font-medium ${hoje ? 'text-[#085041]' : 'text-gray-700'}`}>
                      {format(dia, 'd')}
                    </span>
                  </div>

                  {/* Slots e blocos de agendamento */}
                  <div className="relative" style={{ height: HORAS.length * SLOT_HEIGHT }}>
                    {/* Grade de horas (clicável) */}
                    {HORAS.map(h => (
                      <div
                        key={h}
                        onClick={() => clicarSlot(dia, h)}
                        className="absolute w-full border-b border-black/[0.04] hover:bg-gray-50/60 cursor-pointer transition-colors"
                        style={{ top: (h - 8) * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                      />
                    ))}

                    {/* Linha "agora" se for hoje */}
                    {hoje && <LinhaAgora />}

                    {/* Blocos de agendamento */}
                    {agsNoDia.map((ag, idx) => {
                      const { top, height } = posicaoBloco(ag.inicio, ag.fim)
                      const dentistaIdx = dentistas.findIndex(d => d.id === ag.dentista_id)
                      const cor = corDentista(dentistaIdx)
                      const nomeContato = ag.contato?.nome || ag.contato?.telefone || '–'
                      const nomeProcedimento = ag.procedimento?.nome || ''

                      return (
                        <div
                          key={ag.id}
                          onClick={e => { e.stopPropagation(); setAgSelecionado(ag); setModalAberto(true) }}
                          className="absolute left-0.5 right-0.5 rounded-lg px-2 py-1 cursor-pointer z-10 overflow-hidden border-l-2 transition-opacity hover:opacity-80"
                          style={{ top, height, background: cor.bg, borderColor: cor.border }}
                        >
                          <p className="text-[11px] font-medium leading-tight truncate" style={{ color: cor.text }}>
                            {nomeContato}
                          </p>
                          {height > 36 && (
                            <p className="text-[10px] truncate mt-0.5" style={{ color: cor.border }}>
                              {nomeProcedimento || format(parseISO(ag.inicio), 'HH:mm')}
                            </p>
                          )}
                          {ag.status === 'confirmado' && (
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#1D9E75]" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalAberto && (
        <ModalAgendamento
          slot={slotSelecionado}
          agendamento={agSelecionado}
          dentistas={dentistas}
          onFechar={() => { setModalAberto(false); setAgSelecionado(null) }}
          onSalvar={() => { setModalAberto(false); setAgSelecionado(null); carregar() }}
        />
      )}
    </div>
  )
}

// ── Linha do horário atual ────────────────────────────────
function LinhaAgora() {
  const agora = new Date()
  const minutos = (agora.getHours() - 8) * 60 + agora.getMinutes()
  const top = (minutos / 60) * SLOT_HEIGHT
  if (top < 0 || top > HORAS.length * SLOT_HEIGHT) return null
  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top }}>
      <div className="h-px bg-red-400 relative">
        <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-400" />
      </div>
    </div>
  )
}

// ── Mini calendário lateral ───────────────────────────────
function MiniCal({ semanaBase, onSelectDia }: { semanaBase: Date; onSelectDia: (d: Date) => void }) {
  const [mes, setMes] = useState(new Date())
  const inicioMes = new Date(mes.getFullYear(), mes.getMonth(), 1)
  const diasMes: (Date | null)[] = []

  // Preencher vazios até a segunda-feira
  const diaSemanaInicio = (inicioMes.getDay() + 6) % 7 // 0=seg
  for (let i = 0; i < diaSemanaInicio; i++) diasMes.push(null)
  const totalDias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  for (let i = 1; i <= totalDias; i++) diasMes.push(new Date(mes.getFullYear(), mes.getMonth(), i))

  const inicioSemanaAtual = startOfWeek(semanaBase, { weekStartsOn: 1 })

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setMes(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500">
          <ChevronLeft size={12} />
        </button>
        <span className="text-[11px] font-medium">
          {format(mes, 'MMM yyyy', { locale: ptBR })}
        </span>
        <button onClick={() => setMes(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500">
          <ChevronRight size={12} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0 text-center">
        {['S','T','Q','Q','S','S','D'].map((d, i) => (
          <div key={i} className="text-[9px] text-gray-400 py-0.5">{d}</div>
        ))}
        {diasMes.map((dia, i) => {
          if (!dia) return <div key={`v${i}`} />
          const isHoje = isToday(dia)
          const naSemana = dia >= inicioSemanaAtual && dia < addDays(inicioSemanaAtual, 6)
          return (
            <button
              key={dia.toISOString()}
              onClick={() => onSelectDia(dia)}
              className={`text-[10px] py-0.5 rounded-full transition-colors
                ${isHoje ? 'bg-[#1D9E75] text-white font-medium' :
                  naSemana ? 'bg-[#E1F5EE] text-[#085041]' :
                  'hover:bg-gray-100 text-gray-600'}`}
            >
              {dia.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
