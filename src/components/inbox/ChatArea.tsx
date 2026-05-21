'use client'
// src/components/inbox/ChatArea.tsx
import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Send, Paperclip, FileText, Check, CheckCheck } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useMensagens } from '@/hooks/useMensagens'
import type { Conversa } from '@/types'

function StatusIcon({ status }: { status?: string }) {
  if (status === 'lido') return <CheckCheck size={12} className="text-blue-400" />
  if (status === 'entregue') return <CheckCheck size={12} className="text-gray-400" />
  if (status === 'enviado') return <Check size={12} className="text-gray-400" />
  return null
}

type Props = { conversa: Conversa }

export default function ChatArea({ conversa }: Props) {
  const { mensagens } = useStore()
  const { enviarMensagem } = useMensagens(conversa.id)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const contato = conversa.contato
  const nome = contato?.nome || contato?.telefone || 'Desconhecido'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function handleEnviar() {
    if (!texto.trim() || enviando) return
    setEnviando(true)
    await enviarMensagem(texto.trim())
    setTexto('')
    setEnviando(false)
    inputRef.current?.focus()
  }

  // Agrupar mensagens por data
  const grupos: { data: string; msgs: typeof mensagens }[] = []
  let dataAtual = ''
  for (const msg of mensagens) {
    const data = format(new Date(msg.criado_em), "d 'de' MMMM", { locale: ptBR })
    if (data !== dataAtual) {
      grupos.push({ data, msgs: [msg] })
      dataAtual = data
    } else {
      grupos[grupos.length - 1].msgs.push(msg)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-11 flex items-center gap-2.5 px-4 border-b border-black/[0.06] bg-white flex-shrink-0">
        <div className="w-7 h-7 rounded-full bg-[#E1F5EE] flex items-center justify-center text-[10px] font-medium text-[#085041]">
          {nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium leading-tight">{nome}</p>
          {contato?.telefone && (
            <p className="text-[10px] text-gray-400">{contato.telefone}</p>
          )}
        </div>
        <div className="flex-1" />
        {contato?.interesse && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-[#E1F5EE] text-[#085041]">
            {contato.interesse}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {grupos.map(({ data, msgs }) => (
          <div key={data}>
            <div className="flex justify-center my-3">
              <span className="text-[10px] text-gray-400 bg-white px-3 py-1 rounded-full border border-black/[0.06]">
                {data}
              </span>
            </div>
            {msgs.map(msg => (
              <div
                key={msg.id}
                className={`flex mb-1 ${msg.direcao === 'saida' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[72%] ${msg.direcao === 'saida' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                    ${msg.direcao === 'saida'
                      ? 'bg-[#1D9E75] text-white rounded-br-sm'
                      : 'bg-white border border-black/[0.06] text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.tipo === 'imagem' && <p className="text-xs opacity-70 mb-1">📷 Imagem</p>}
                    {msg.tipo === 'audio'  && <p className="text-xs opacity-70">🎵 Áudio</p>}
                    {msg.tipo === 'documento' && <p className="text-xs opacity-70 flex items-center gap-1"><FileText size={11}/>{msg.conteudo || 'Documento'}</p>}
                    {(msg.tipo === 'texto' || msg.tipo === 'template') && (
                      <p className="whitespace-pre-wrap break-words">{msg.conteudo}</p>
                    )}
                    {msg.automatico && (
                      <span className="text-[9px] opacity-60 block mt-0.5">automático</span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 mt-0.5 ${msg.direcao === 'saida' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[10px] text-gray-400">
                      {format(new Date(msg.criado_em), 'HH:mm')}
                    </span>
                    {msg.direcao === 'saida' && <StatusIcon status={msg.status_entrega} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-black/[0.06] bg-white p-3 flex items-center gap-2 flex-shrink-0">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
          <Paperclip size={16} />
        </button>
        <input
          ref={inputRef}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleEnviar()}
          placeholder="Digite uma mensagem..."
          className="flex-1 text-sm bg-gray-50 border border-black/[0.06] rounded-xl px-3 py-2 outline-none focus:border-[#1D9E75]/40 transition-colors"
        />
        <button
          onClick={handleEnviar}
          disabled={!texto.trim() || enviando}
          className="w-8 h-8 rounded-lg bg-[#1D9E75] flex items-center justify-center text-white hover:opacity-90 disabled:opacity-40 transition-all"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
