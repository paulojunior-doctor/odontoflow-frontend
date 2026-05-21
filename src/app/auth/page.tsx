'use client'
// src/app/auth/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Stethoscope } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function entrar() {
    setCarregando(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('E-mail ou senha incorretos')
      setCarregando(false)
      return
    }
    router.push('/dashboard/inbox')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-10 h-10 rounded-xl bg-[#1D9E75] flex items-center justify-center">
            <Stethoscope size={20} color="white" />
          </div>
          <span className="text-xl font-medium tracking-tight">OdontoFlow</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-black/[0.08] p-8">
          <h1 className="text-lg font-medium mb-6">Entrar na sua clínica</h1>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && entrar()}
                placeholder="voce@clinica.com.br"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-black/10 outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && entrar()}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-black/10 outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10 transition-all"
              />
            </div>

            {erro && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>
            )}

            <button
              onClick={entrar}
              disabled={carregando || !email || !senha}
              className="w-full py-2.5 rounded-lg bg-[#1D9E75] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Acesso restrito à equipe da clínica
        </p>
      </div>
    </div>
  )
}
