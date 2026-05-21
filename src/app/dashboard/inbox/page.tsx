'use client'
// src/app/dashboard/inbox/page.tsx
import { useStore } from '@/lib/store'
import { useConversas } from '@/hooks/useConversas'
import ConversaItem from '@/components/inbox/ConversaItem'
import ChatArea from '@/components/inbox/ChatArea'
import PainelCRM from '@/components/inbox/PainelCRM'
import { MessageSquare, Search } from 'lucide-react'
import { useState } from 'react'

export default function InboxPage() {
  const { conversaAtiva, setConversaAtiva } = useStore()
  const { conversas, carregando } = useConversas()
  const [busca, setBusca] = useState('')

  const naoLidas = conversas.filter(c => !c.lida).length

  const conversasFiltradas = busca
    ? conversas.filter(c =>
        c.contato?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        c.contato?.telefone?.includes(busca) ||
        c.ultima_mensagem?.toLowerCase().includes(busca.toLowerCase())
      )
    : conversas

  return (
    <div className="flex h-full overflow-hidden">
      {/* Lista de conversas */}
      <div className="w-60 flex flex-col border-r border-black/[0.06] bg-white flex-shrink-0">
        {/* Header */}
        <div className="px-3 pt-3 pb-2 border-b border-black/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Inbox</span>
            {naoLidas > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1D9E75] text-white font-medium">
                {naoLidas}
              </span>
            )}
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-2 text-gray-400" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar conversa..."
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-gray-50 border border-black/[0.06] rounded-lg outline-none focus:border-[#1D9E75]/40"
            />
          </div>
        </div>

        {/* Conversas */}
        <div className="flex-1 overflow-y-auto">
          {carregando ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-4 h-4 rounded-full border-2 border-[#1D9E75] border-t-transparent animate-spin" />
            </div>
          ) : conversasFiltradas.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8 px-4">
              Nenhuma conversa encontrada
            </p>
          ) : (
            conversasFiltradas.map(conversa => (
              <ConversaItem
                key={conversa.id}
                conversa={conversa}
                ativa={conversaAtiva?.id === conversa.id}
                onClick={() => setConversaAtiva(conversa)}
              />
            ))
          )}
        </div>
      </div>

      {/* Área de chat */}
      {conversaAtiva ? (
        <>
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatArea conversa={conversaAtiva} />
          </div>
          <PainelCRM conversa={conversaAtiva} />
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
            <MessageSquare size={22} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Selecione uma conversa</p>
            <p className="text-xs mt-1">Escolha uma conversa à esquerda para começar</p>
          </div>
        </div>
      )}
    </div>
  )
}
