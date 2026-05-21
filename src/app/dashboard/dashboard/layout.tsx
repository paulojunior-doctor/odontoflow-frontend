'use client'
// src/app/dashboard/layout.tsx
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import {
  MessageSquare, Columns, Calendar,
  BarChart2, Zap, Settings, LogOut, Stethoscope
} from 'lucide-react'

const navItems = [
  { href: '/dashboard/inbox',      icon: MessageSquare, label: 'Inbox' },
  { href: '/dashboard/pipeline',   icon: Columns,       label: 'Pipeline' },
  { href: '/dashboard/agenda',     icon: Calendar,      label: 'Agenda' },
  { href: '/dashboard/dashboard',  icon: BarChart2,     label: 'Dashboard' },
  { href: '/dashboard/automacoes', icon: Zap,           label: 'Automações' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { usuario, setUsuario, setClinica } = useStore()

  useEffect(() => {
    async function carregarUsuario() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: u } = await supabase
        .from('usuarios')
        .select('*, clinicas(*)')
        .eq('id', user.id)
        .single()

      if (u) {
        setUsuario(u)
        setClinica(u.clinicas)
      }
    }
    carregarUsuario()
  }, [])

  async function sair() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <div className="flex h-screen bg-[#f8f7f4] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-14 flex flex-col items-center py-3 bg-white border-r border-black/[0.06] gap-1">
        {/* Logo */}
        <div className="w-8 h-8 rounded-lg bg-[#1D9E75] flex items-center justify-center mb-3">
          <Stethoscope size={15} color="white" />
        </div>

        {/* Nav */}
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all
                ${active
                  ? 'bg-[#E1F5EE] text-[#085041] shadow-[inset_0_0_0_1px_rgba(29,158,117,0.2)]'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                }`}
            >
              <Icon size={17} />
            </Link>
          )
        })}

        <div className="flex-1" />

        <Link href="/dashboard/configuracoes" title="Configurações"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all">
          <Settings size={17} />
        </Link>

        <button onClick={sair} title="Sair"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all">
          <LogOut size={17} />
        </button>

        {/* Avatar */}
        {usuario && (
          <div className="w-8 h-8 rounded-full bg-[#E1F5EE] flex items-center justify-center text-[10px] font-medium text-[#085041] mt-1">
            {usuario.nome.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
          </div>
        )}
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  )
}
