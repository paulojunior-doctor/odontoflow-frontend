'use client'
// src/components/agenda/ModalAgendamento.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { format, addMinutes, parseISO } from 'date-fns'
import { X, Trash2, CheckCircle, Search } from 'lucide-react'

type Dentista = { id: string; nome: string; cargo: string }

type ContatoBusca = {
  id: string
  nome?: string
  telefone: string
  interesse?: string
}

type AgendamentoForm = {
  id?: string
  dentista_id?: string
  inicio?: string
  fim?: string
  status?: string
  observacoes?: string
  contato?: ContatoBusca
  procedimento?: { nome: string; cor: string }
}

type Props = {
  slot: { data: Date; dentista_id?: string } | null
  agendamento: AgendamentoForm | null
  dentistas: Dentista[]
  onFechar: () => void
  onSalvar: () => void
}

const STATUS_LABELS: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  nao_compareceu: 'Não compareceu',
}

const STATUS_CORES: Record<string, string> = {
  agendado: '#185FA5',
  confirmado: '#1D9E75',
  concluido: '#888780',
  cancelado: '#E24B4A',
  nao_compareceu: '#BA7517',
}

export default function ModalAgendamento({ slot, agendamento, dentistas, onFechar, onSalvar }: Props) {
  const { clinica, usuario } = useStore()
  const supabase = createClient()
  const isEdicao = !!agendamento?.id

  const [dentistaId, setDentistaId] = useState(
    agendamento?.dentista_id || slot?.dentista_id || dentistas[0]?.id || ''
  )
  const [inicio, setInicio] = useState(
    agendamento?.inicio
      ? format(parseISO(agendamento.inicio), "yyyy-MM-dd'T'HH:mm")
      : slot ? format(slot.data, "yyyy-MM-dd'T'HH:mm") : ''
  )
  const [duracao, setDuracao] = useState(60)
  const [observacoes, setObservacoes] = useState(agendamento?.observacoes || '')
  const [status, setStatus] = useState(agendamento?.status || 'agendado')
  const [procedimentos, setProcedimentos] = useState<{ id: string; nome: string; duracao_min: number }[]>([])
  const [procedimentoId, setProcedimentoId] = useState('')

  const [buscaContato, setBuscaContato] = useState(
    agendamento?.contato?.nome || agendamento?.contato?.telefone || ''
  )
  const [contatoSelecionado, setContatoSelecionado] = useState<ContatoBusca | null>(
    agendamento?.contato || null
  )
  const [resultados, setResultados] = useState<ContatoBusca[]>([])
  const [buscando, setBuscando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!clinica) return
    supabase
      .from('procedimentos')
      .select('id, nome, duracao_min')
      .eq('clinica_id', clinica.id)
      .eq('ativo', true)
      .then(({ data }) => setProcedimentos(data || []))
  }, [clinica])

  useEffect(() => {
    const proc = procedimentos.find(p => p.id === procedimentoId)
    if (proc) setDuracao(proc.duracao_min)
  }, [procedimentoId, procedimentos])

  useEffect(() => {
    if (buscaContato.length < 2 || contatoSelecionado) { setResultados([]); return }
    const t = setTimeout(async () => {
      setBuscando(true)
      const { data } = await supabase
        .from('contatos')
        .select('id, nome, telefone, interesse')
        .eq('clinica_id', clinica!.id)
        .or(`nome.ilike.%${buscaContato}%,telefone.ilike.%${buscaContato}%`)
        .limit(5)
      setResultados((data || []) as ContatoBusca[])
      setBuscando(false)
    }, 300)
    return () => clearTimeout(t)
  }, [buscaContato, contatoSelecionado])

  async function salvar() {
    if (!contatoSelecionado || !dentistaId || !inicio) {
      setErro('Preencha paciente, dentista e horário')
      return
    }
    setSalvando(true)
    setErro('')

    const fimDate = addMinutes(new Date(inicio), duracao)
    const payload = {
      clinica_id: clinica!.id,
      contato_id: contatoSelecionado.id,
      dentista_id: dentistaId,
      procedimento_id: procedimentoId || null,
      inicio: new Date(inicio).toISOString(),
      fim: fimDate.toISOString(),
      status,
      observacoes: observacoes || null,
      criado_por: usuario?.id,
    }

    let error
    if (isEdicao) {
      ;({ error } = await supabase.from('agendamentos').update(payload).eq('id', agendamento!.id!))
    } else {
      ;({ error } = await supabase.from('agendamentos').insert(payload))
    }

    if (error) {
      if (error.code === '23P01') {
        setErro('Este dentista já tem consulta neste horário')
      } else {
        setErro('Erro ao salvar. Tente novamente.')
      }
      setSalvando(false)
      return
    }

    onSalvar()
  }

  async function cancelarAgendamento() {
    if (!agendamento?.id) return
    await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', agendamento.id)
    onSalvar()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
      onClick={e => e.target === e.currentTarget && onFechar()}
    >
      <div className="bg-white rounded-2xl border border-black/[0.08] w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
          <h2 className="text-sm font-medium">
            {isEdicao ? 'Editar agendamento' : 'Novo agendamento'}
          </h2>
          <div className="flex items-center gap-2">
            {isEdicao && agendamento?.status !== 'cancelado' && (
              <button onClick={cancelarAgendamento}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={onFechar}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {isEdicao && (
            <div className="flex gap-1.5 flex-wrap">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <button key={key} onClick={() => setStatus(key)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                    status === key ? 'border-transparent text-white' : 'border-black/[0.08] text-gray-500 hover:bg-gray-50'
                  }`}
                  style={status === key ? { background: STATUS_CORES[key] } : {}}>
                  {label}
                </button>
              ))}
            </div>
          )}

          <div>
            <label className="text-[11px] text-gray-400 block mb-1.5">Paciente</label>
            {contatoSelecionado ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#E1F5EE] border border-[#1D9E75]/20">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#085041]">{contatoSelecionado.nome || contatoSelecionado.telefone}</p>
                  {contatoSelecionado.telefone && contatoSelecionado.nome && (
                    <p className="text-[10px] text-[#1D9E75]">{contatoSelecionado.telefone}</p>
                  )}
                </div>
                <button onClick={() => { setContatoSelecionado(null); setBuscaContato('') }}
                  className="text-[#1D9E75] hover:text-[#085041]"><X size={14} /></button>
              </div>
            ) : (
              <div className="relative">
                <Search size={12} className="absolute left-3 top-2.5 text-gray-400" />
                <input value={buscaContato} onChange={e => setBuscaContato(e.target.value)}
                  placeholder="Buscar por nome ou telefone..."
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-black/10 outline-none focus:border-[#1D9E75]/50 transition-colors" />
                {resultados.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/[0.08] rounded-xl shadow-lg z-10 overflow-hidden">
                    {resultados.map(c => (
                      <button key={c.id} onClick={() => { setContatoSelecionado(c); setResultados([]) }}
                        className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-black/[0.04] last:border-0">
                        <p className="text-sm">{c.nome || c.telefone}</p>
                        {c.nome && <p className="text-[10px] text-gray-400">{c.telefone}</p>}
                        {c.interesse && <span className="text-[10px] text-[#1D9E75]">{c.interesse}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {buscando && (
                  <div className="absolute right-3 top-2.5">
                    <div className="w-3 h-3 rounded-full border-2 border-[#1D9E75] border-t-transparent animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] text-gray-400 block mb-1.5">Dentista</label>
            <select value={dentistaId} onChange={e => setDentistaId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 outline-none focus:border-[#1D9E75]/50 bg-white">
              <option value="">Selecionar dentista</option>
              {dentistas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>

          {procedimentos.length > 0 && (
            <div>
              <label className="text-[11px] text-gray-400 block mb-1.5">Procedimento</label>
              <select value={procedimentoId} onChange={e => setProcedimentoId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 outline-none focus:border-[#1D9E75]/50 bg-white">
                <option value="">Selecionar procedimento</option>
                {procedimentos.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.duracao_min}min)</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1.5">Data e hora</label>
              <input type="datetime-local" value={inicio} onChange={e => setInicio(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 outline-none focus:border-[#1D9E75]/50" />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 block mb-1.5">Duração</label>
              <select value={duracao} onChange={e => setDuracao(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 outline-none focus:border-[#1D9E75]/50 bg-white">
                {[30,45,60,90,120].map(d => (
                  <option key={d} value={d}>{d >= 60 ? `${d/60}h${d%60?` ${d%60}min`:''}` : `${d}min`}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-gray-400 block mb-1.5">Observações</label>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2}
              placeholder="Informações adicionais..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 outline-none focus:border-[#1D9E75]/50 resize-none" />
          </div>

          {erro && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-black/[0.06]">
          <button onClick={onFechar}
            className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
          <button onClick={salvar} disabled={salvando}
            className="px-4 py-2 rounded-lg bg-[#1D9E75] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5">
            {salvando
              ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <CheckCircle size={14} />}
            {isEdicao ? 'Salvar alterações' : 'Criar agendamento'}
          </button>
        </div>
      </div>
    </div>
  )
}
