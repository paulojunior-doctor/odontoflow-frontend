'use client'
// src/app/dashboard/automacoes/page.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { Zap, Clock, Tag, Calendar, RefreshCw, Star, Columns, Plus } from 'lucide-react'
import type { Automacao } from '@/types'

const ICONES: Record<string, React.ReactNode> = {
  nova_mensagem:        <Zap size={15} />,
  sem_resposta:         <Clock size={15} />,
  tag_aplicada:         <Tag size={15} />,
  consulta_agendada:    <Calendar size={15} />,
  consulta_concluida:   <Star size={15} />,
  card_movido:          <Columns size={15} />,
  agendamento_proximo:  <RefreshCw size={15} />,
}

const ICONE_CORES: Record<string, string> = {
  nova_mensagem:       '#E1F5EE',
  sem_resposta:        '#FAEEDA',
  tag_aplicada:        '#EEEDFE',
  consulta_agendada:   '#E6F1FB',
  consulta_concluida:  '#FAEEDA',
  card_movido:         '#E1F5EE',
  agendamento_proximo: '#FAECE7',
}

export default function AutomacoesPage() {
  const [automacoes, setAutomacoes] = useState<Automacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const { clinica } = useStore()
  const supabase = createClient()

  useEffect(() => {
    if (!clinica) return
    supabase
      .from('automacoes')
      .select('*')
      .eq('clinica_id', clinica.id)
      .order('criado_em')
      .then(({ data }) => {
        setAutomacoes(data || [])
        setCarregando(false)
      })
  }, [clinica])

  async function toggleAtiva(id: string, ativa: boolean) {
    setAutomacoes(prev => prev.map(a => a.id === id ? { ...a, ativa } : a))
    await supabase.from('automacoes').update({ ativa }).eq('id', id)
  }

  const ativas = automacoes.filter(a => a.ativa).length

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="h-11 flex items-center px-4 border-b border-black/[0.06] bg-white flex-shrink-0">
        <span className="text-sm font-medium">Automações</span>
        <span className="ml-2 text-xs text-gray-400">{ativas} ativas</span>
        <div className="flex-1" />
        <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#1D9E75] text-white hover:opacity-90 transition-opacity">
          <Plus size={13} /> Nova automação
        </button>
      </div>

      <div className="p-4 max-w-2xl">
        {carregando ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-4 h-4 rounded-full border-2 border-[#1D9E75] border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {automacoes.map(auto => (
              <div
                key={auto.id}
                className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 transition-opacity ${
                  auto.ativa ? 'border-black/[0.06]' : 'border-black/[0.04] opacity-60'
                }`}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: ICONE_CORES[auto.gatilho_tipo] || '#F1EFE8', color: '#444' }}
                >
                  {ICONES[auto.gatilho_tipo] || <Zap size={15} />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{auto.nome}</p>
                  {auto.descricao && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{auto.descricao}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {auto.delay_minutos > 0 && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={9} /> {auto.delay_minutos >= 60
                          ? `${auto.delay_minutos / 60}h de delay`
                          : `${auto.delay_minutos}min de delay`}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {auto.total_execucoes} execuções
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleAtiva(auto.id, !auto.ativa)}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                    auto.ativa ? 'bg-[#1D9E75]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                      auto.ativa ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}

            {automacoes.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Zap size={24} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma automação configurada</p>
                <p className="text-xs mt-1">Crie regras para automatizar follow-ups e tarefas</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
