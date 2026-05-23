'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, Bell, Shield, Smartphone, Save, RefreshCw } from 'lucide-react'

const EVOLUTION_API_URL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'https://evolution-api-production-494c.up.railway.app'
const EVOLUTION_API_KEY = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || ''
const INSTANCIA = 'clinica-principal'

export default function PaginaConfiguracoes() {
  const [notifMensagens, setNotifMensagens] = useState(true)
  const [notifAgenda, setNotifAgenda] = useState(true)
  const [notifFollowUp, setNotifFollowUp] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [statusWA, setStatusWA] = useState<'carregando' | 'conectado' | 'desconectado'>('carregando')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [carregandoQR, setCarregandoQR] = useState(false)

  const verificarStatus = useCallback(async () => {
    try {
      const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCIA}`, {
        headers: { apikey: EVOLUTION_API_KEY }
      })
      const data = await res.json()
      const estado = data?.instance?.state
      if (estado === 'open') {
        setStatusWA('conectado')
        setQrCode(null)
      } else {
        setStatusWA('desconectado')
      }
    } catch {
      setStatusWA('desconectado')
    }
  }, [])

  useEffect(() => {
    verificarStatus()
    const intervalo = setInterval(verificarStatus, 15000)
    return () => clearInterval(intervalo)
  }, [verificarStatus])

  async function conectar() {
    setCarregandoQR(true)
    setQrCode(null)
    try {
      const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCIA}`, {
        headers: { apikey: EVOLUTION_API_KEY }
      })
      const data = await res.json()
      if (data?.base64) {
        setQrCode(data.base64)
      } else if (data?.code) {
        setQrCode(`data:image/png;base64,${data.code}`)
      }
    } catch {
      alert('Erro ao gerar QR Code')
    } finally {
      setCarregandoQR(false)
    }
  }

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Smartphone size={16} className="text-[#1D9E75]" />
              <h2 className="font-medium text-[#085041]">WhatsApp</h2>
            </div>
            <button onClick={verificarStatus} className="text-gray-400 hover:text-[#1D9E75] transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="text-sm text-gray-500 space-y-1 mb-4">
            <p>Instância: <span className="font-medium text-[#085041]">{INSTANCIA}</span></p>
            <p>Status: {
              statusWA === 'carregando' ? <span className="text-gray-400">Verificando...</span>
              : statusWA === 'conectado' ? <span className="text-green-600 font-medium">✓ Conectado</span>
              : <span className="text-red-500 font-medium">✗ Desconectado</span>
            }</p>
          </div>

          {statusWA === 'desconectado' && (
            <div className="mt-3">
              <button
                onClick={conectar}
                disabled={carregandoQR}
                className="w-full flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#085041] disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-all"
              >
                {carregandoQR ? 'Gerando QR Code...' : 'Conectar WhatsApp'}
              </button>

              {qrCode && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <p className="text-xs text-gray-500">Escaneie com o WhatsApp → Dispositivos conectados</p>
                  <img src={qrCode} alt="QR Code WhatsApp" className="w-48 h-48 rounded-lg border border-gray-200" />
                  <p className="text-xs text-gray-400">O QR Code expira em 60 segundos</p>
                </div>
              )}
            </div>
          )}
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
