'use client'

import { useState } from 'react'
import { Settings, Bell, Shield, Smartphone, Save } from 'lucide-react'

export default function PaginaConfiguracoes() {
  const [notifMensagens, setNotifMensagens] = useState(true)
  const [notifAgenda, setNotifAgenda] = useState(true)
  const [notifFollowUp, setNotifFollowUp] = useState(false)
  const [salvo, setSalvo] = useState(false)

  function salvar() {
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f8f7f4]">
      <div className="max-w-2xl mx-auto">

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-[#1D9E75] flex items-center justify-center">
            <Settings size={18} color="white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#085041]">Configurações</h1>
            <p className="text-xs text-gray-400">Gerencie suas preferências</p>
          </div>
        </div>

        {/* Notificações */}
        <div className="bg-white rounded-xl border border-black/[0.06] p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-[#1D9E75]" />
            <h2 className="font-medium text-[#085041]">Notificações</h2>
          </div>
          <div className="space-y-4">
            <Toggle label="Novas mensagens WhatsApp" value={notifMensagens} onChange={setNotifMensagens} />
            <Toggle label="Lembretes de agenda" value={notifAgenda} onChange={setNotifAgenda} />
            <Toggle label="Follow-up automático" value={notifFollowUp} onChange={setNotifFollowUp} />
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-white rounded-xl border border-black/[0.06] p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone size={16} className="text-[#1D9E75]" />
            <h2 className="font-medium text-[#085041]">WhatsApp</h2>
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Instância: <span className="font-medium text-[#085041]">clinica-principal</span></p>
            <p>Status: <span className="text-green-600 font-medium">Conectado</span></p>
          </div>
        </div>

        {/* Segurança */}
        <div className="bg-white rounded-xl border border-black/[0.06] p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-[#1D9E75]" />
            <h2 className="font-medium text-[#085041]">Segurança</h2>
          </div>
          <button className="text-sm text-[#1D9E75] hover:underline">
            Alterar senha
          </button>
        </div>

        {/* Salvar */}
        <button
          onClick={salvar}
          className="w-full flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#085041] text-white font-medium py-2.5 rounded-lg transition-all"
        >
          <Save size={16} />
          {salvo ? 'Salvo!' : 'Salvar configurações'}
        </button>

      </div>
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-all relative ${value ? 'bg-[#1D9E75]' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  )
}
