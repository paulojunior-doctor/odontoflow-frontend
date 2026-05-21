// src/lib/store.ts
import { create } from 'zustand'
import type { Usuario, Clinica, Conversa, Mensagem } from '@/types'

type AppStore = {
  // Auth
  usuario: Usuario | null
  clinica: Clinica | null
  setUsuario: (u: Usuario | null) => void
  setClinica: (c: Clinica | null) => void

  // Inbox
  conversaAtiva: Conversa | null
  setConversaAtiva: (c: Conversa | null) => void
  mensagens: Mensagem[]
  setMensagens: (msgs: Mensagem[]) => void
  adicionarMensagem: (msg: Mensagem) => void

  // UI
  sidebarAberta: boolean
  setSidebarAberta: (v: boolean) => void
}

export const useStore = create<AppStore>((set) => ({
  usuario: null,
  clinica: null,
  setUsuario: (usuario) => set({ usuario }),
  setClinica: (clinica) => set({ clinica }),

  conversaAtiva: null,
  setConversaAtiva: (conversaAtiva) => set({ conversaAtiva, mensagens: [] }),
  mensagens: [],
  setMensagens: (mensagens) => set({ mensagens }),
  adicionarMensagem: (msg) =>
    set((state) => ({ mensagens: [...state.mensagens, msg] })),

  sidebarAberta: true,
  setSidebarAberta: (sidebarAberta) => set({ sidebarAberta }),
}))
