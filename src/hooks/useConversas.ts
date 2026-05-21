'use client'
// src/hooks/useConversas.ts
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import type { Conversa } from '@/types'

export function useConversas() {
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [carregando, setCarregando] = useState(true)
  const { clinica } = useStore()
  const supabase = createClient()

  const carregar = useCallback(async () => {
    if (!clinica) return
    const { data } = await supabase
      .from('conversas')
      .select(`
        *,
        contato:contatos(id, nome, telefone, interesse),
        atribuido_para_usuario:usuarios!atribuido_para(id, nome)
      `)
      .eq('clinica_id', clinica.id)
      .not('status', 'in', '("resolvida","spam")')
      .order('ultima_msg_em', { ascending: false })
      .limit(50)

    setConversas((data as Conversa[]) || [])
    setCarregando(false)
  }, [clinica])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Realtime — escuta novas mensagens e atualiza a lista
  useEffect(() => {
    if (!clinica) return

    const channel = supabase
      .channel('conversas-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversas',
          filter: `clinica_id=eq.${clinica.id}`,
        },
        () => { carregar() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [clinica, carregar])

  return { conversas, carregando, recarregar: carregar }
}
