'use client'
// src/components/inbox/PainelCRM.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Calendar, Clock, Tag, User, Phone, Zap } from 'lucide-react'
import type { Conversa, Contato, Tag as TagType } from '@/types'

type Props = { conversa: Conversa }

export default function PainelCRM({ conversa }: Props) {
  const [contato, setContato] = useState<Contato | null>(null)
  const [tags, setTags] = useState<TagType[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('contatos')
        .select('*')
        .eq('id', conversa.contato_id)
        .single()
      setContato(data)

      const { data: ct } = await supabase
        .from('contato_tags')
        .select('tag:tags(id, nome, cor)')
        .eq('contato_id', conversa.contato_id)
      setTags(ct?.map((r: any) => r.tag) || [])
    }
    carregar()
  }, [conversa.contato_id])

  if (!contato) return (
    <div className="w-52 border-l border-black/[0.06] bg-white p-4 flex items-center justify-center">
      <div className="w-4 h-4 rounded-full border-2 border-[#1D9E75] border-t-transparent animate-spin" />
    </div>
  )

  const nome = contato.nome || contato.telefone
  const iniciais = nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="w-52 border-l border-black/[0.06] bg-white overflow-y-auto flex-shrink-0">
      <div className="p-4 space-y-4">
        {/* Avatar + nome */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[#E1F5EE] flex items-center justify-center text-sm font-medium text-[#085041] mx-auto mb-2">
            {iniciais}
          </div>
          <p className="text-sm font-medium leading-tight">{nome}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {contato.tipo === 'lead' ? 'Lead' : 'Paciente'}
          </p>
        </div>

        {/* Info */}
        <div className="space-y-2">
          <Label icon={<Phone size={10} />} label="Telefone" value={contato.telefone} />
          {contato.interesse && (
            <Label icon={<Tag size={10} />} label="Interesse" value={contato.interesse} />
          )}
          {contato.origem && (
            <Label icon={<User size={10} />} label="Origem" value={contato.origem} />
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <span
                  key={tag.id}
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: tag.cor + '22', color: tag.cor }}
                >
                  {tag.nome}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Próxima ação */}
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Próxima ação</p>
          <div className="bg-[#FAEEDA] rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-[#633806]">
              <Clock size={11} />
              <span className="text-xs font-medium">Follow-up em 2h</span>
            </div>
            <p className="text-[10px] text-[#BA7517] mt-0.5 flex items-center gap-1">
              <Zap size={9} /> Automático
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-1.5">
          <button className="w-full text-xs py-2 rounded-lg border border-black/[0.08] hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 text-gray-600">
            <Calendar size={12} /> Agendar consulta
          </button>
        </div>
      </div>
    </div>
  )
}

function Label({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-[9px] text-gray-400">{label}</p>
        <p className="text-xs text-gray-700">{value}</p>
      </div>
    </div>
  )
}
