'use client'
// src/hooks/useMensagens.ts
import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import type { Mensagem } from '@/types'

export function useMensagens(conversaId: string | null) {
  const { setMensagens, adicionarMensagem, clinica } = useStore()
  const supabase = createClient()

  const carregar = useCallback(async () => {
    if (!conversaId) return
    const { data } = await supabase
      .from('mensagens')
      .select('*')
      .eq('conversa_id', conversaId)
      .order('criado_em', { ascending: true })
      .limit(100)

    setMensagens((data as Mensagem[]) || [])

    // Marcar conversa como lida
    await supabase
      .from('conversas')
      .update({ lida: true })
      .eq('id', conversaId)
  }, [conversaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Realtime — novas mensagens aparecem instantaneamente
  useEffect(() => {
    if (!conversaId) return

    const channel = supabase
      .channel(`mensagens-${conversaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `conversa_id=eq.${conversaId}`,
        },
        (payload) => { adicionarMensagem(payload.new as Mensagem) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversaId])

  async function enviarMensagem(texto: string) {
    if (!conversaId || !texto.trim()) return

    // Buscar instância do canal para esta conversa
    const { data: conversa } = await supabase
      .from('conversas')
      .select('canal:canais_whatsapp(evolution_instance), contato:contatos(telefone)')
      .eq('id', conversaId)
      .single()

    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/mensagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversaId,
        texto,
        instancia: (conversa?.canal as any)?.evolution_instance,
        telefone: (conversa?.contato as any)?.telefone,
      }),
    })
  }

  return { enviarMensagem }
}
