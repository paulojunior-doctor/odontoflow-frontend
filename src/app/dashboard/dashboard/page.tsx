'use client'
// src/app/dashboard/dashboard/page.tsx
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { createClient } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { TrendingUp, MessageSquare, CalendarCheck, Clock } from 'lucide-react'

type Metricas = {
  conversas_hoje: number
  nao_lidas: number
  agendamentos_hoje: number
  tempo_medio_resposta: string
}

type DiaData = { dia: string; total: number }

export default function DashboardPage() {
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [grafico, setGrafico] = useState<DiaData[]>([])
  const [funil, setFunil] = useState<{ nome: string; total: number; cor: string }[]>([])
  const { clinica } = useStore()
  const supabase = createClient()

  useEffect(() => {
    if (!clinica) return

    async function carregar() {
      const agora = new Date()
      const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).toISOString()
      const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1).toISOString()

      const { count: hoje } = await supabase
        .from('conversas').select('*', { count: 'exact', head: true })
        .eq('clinica_id', clinica!.id).gte('criado_em', inicioHoje)

      const { count: naoLidas } = await supabase
        .from('conversas').select('*', { count: 'exact', head: true })
        .eq('clinica_id', clinica!.id).eq('lida', false)

      const { count: agsHoje } = await supabase
        .from('agendamentos').select('*', { count: 'exact', head: true })
        .eq('clinica_id', clinica!.id).gte('inicio', inicioHoje).lt('inicio', amanha)

      setMetricas({
        conversas_hoje: hoje || 0,
        nao_lidas: naoLidas || 0,
        agendamentos_hoje: agsHoje || 0,
        tempo_medio_resposta: '4 min',
      })

      const diasLabels = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
      const grafData: DiaData[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const ini = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
        const fim = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString()
        const { count } = await supabase
          .from('conversas').select('*', { count: 'exact', head: true })
          .eq('clinica_id', clinica!.id).gte('criado_em', ini).lt('criado_em', fim)
        grafData.push({ dia: diasLabels[d.getDay()], total: count || 0 })
      }
      setGrafico(grafData)

      const { data: colunas } = await supabase
        .from('pipeline_colunas').select('id, nome, cor')
        .eq('clinica_id', clinica!.id).order('ordem')
      if (colunas) {
        const funilData = await Promise.all(colunas.slice(0, 5).map(async col => {
          const { count } = await supabase
            .from('pipeline_cards').select('*', { count: 'exact', head: true })
            .eq('coluna_id', col.id).eq('arquivado', false)
          return { nome: col.nome, total: count || 0, cor: col.cor }
        }))
        setFunil(funilData)
      }
    }

    carregar()
  }, [clinica])

  const maxFunil = Math.max(...funil.map(f => f.total), 1)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="h-11 flex items-center px-4 border-b border-black/[0.06] bg-white flex-shrink-0">
        <span className="text-sm font-medium">Dashboard</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Conversas hoje', value: metricas?.conversas_hoje ?? '–', icon: <MessageSquare size={14} />, cor: '#1D9E75' },
            { label: 'Não lidas',       value: metricas?.nao_lidas ?? '–',      icon: <TrendingUp size={14} />,    cor: '#E24B4A' },
            { label: 'Consultas hoje',  value: metricas?.agendamentos_hoje ?? '–', icon: <CalendarCheck size={14} />, cor: '#185FA5' },
            { label: 'Resp. média',     value: metricas?.tempo_medio_resposta ?? '–', icon: <Clock size={14} />,  cor: '#BA7517' },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-xl border border-black/[0.06] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{m.label}</p>
                <span style={{ color: m.cor }}>{m.icon}</span>
              </div>
              <p className="text-2xl font-medium">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-black/[0.06] p-4">
            <p className="text-xs font-medium mb-4">Conversas — últimos 7 dias</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={grafico} barSize={20}>
                <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '0.5px solid #e5e7eb' }} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {grafico.map((_, i) => (
                    <Cell key={i} fill={i === grafico.length - 1 ? '#1D9E75' : '#E1F5EE'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-black/[0.06] p-4">
            <p className="text-xs font-medium mb-4">Funil de conversão</p>
            <div className="space-y-2.5">
              {funil.map(f => (
                <div key={f.nome} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28 truncate">{f.nome}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div className="h-full rounded-full flex items-center px-2 transition-all"
                      style={{ width: `${Math.max((f.total / maxFunil) * 100, 8)}%`, background: f.cor || '#1D9E75' }}>
                      <span className="text-[10px] text-white font-medium">{f.total}</span>
                    </div>
                  </div>
                </div>
              ))}
              {funil.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum dado ainda</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
