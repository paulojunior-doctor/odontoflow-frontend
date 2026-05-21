'use client'
// src/components/inbox/ConversaItem.tsx
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Conversa } from '@/types'

function iniciais(nome?: string) {
  if (!nome) return '?'
  return nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const CORES_AVATAR = [
  'bg-[#E1F5EE] text-[#085041]',
  'bg-[#E6F1FB] text-[#042C53]',
  'bg-[#FAEEDA] text-[#633806]',
  'bg-[#EEEDFE] text-[#26215C]',
  'bg-[#FAECE7] text-[#4A1B0C]',
]

function corAvatar(telefone: string) {
  const idx = telefone.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return CORES_AVATAR[idx % CORES_AVATAR.length]
}

type Props = {
  conversa: Conversa
  ativa: boolean
  onClick: () => void
}

export default function ConversaItem({ conversa, ativa, onClick }: Props) {
  const contato = conversa.contato
  const nome = contato?.nome || contato?.telefone || 'Desconhecido'
  const cor = corAvatar(contato?.telefone || '')
  const tempo = conversa.ultima_msg_em
    ? formatDistanceToNow(new Date(conversa.ultima_msg_em), { locale: ptBR, addSuffix: false })
    : ''

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 flex gap-2.5 items-start transition-colors border-b border-black/[0.04]
        ${ativa ? 'bg-[#E1F5EE]' : 'hover:bg-gray-50'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 mt-0.5 ${cor}`}>
        {iniciais(contato?.nome)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-sm truncate ${!conversa.lida ? 'font-semibold' : 'font-medium'}`}>
            {nome}
          </span>
          <span className="text-[10px] text-gray-400 flex-shrink-0">{tempo}</span>
        </div>

        <p className={`text-xs truncate mt-0.5 ${!conversa.lida ? 'text-gray-800' : 'text-gray-400'}`}>
          {conversa.ultima_mensagem || 'Nova conversa'}
        </p>

        {contato?.interesse && (
          <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-[#E1F5EE] text-[#085041]">
            {contato.interesse}
          </span>
        )}
      </div>

      {/* Indicador não lida */}
      {!conversa.lida && (
        <div className="w-2 h-2 rounded-full bg-[#1D9E75] flex-shrink-0 mt-2" />
      )}
    </button>
  )
}
