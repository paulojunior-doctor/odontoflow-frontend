// src/types/index.ts

export type Clinica = {
  id: string
  nome: string
  plano: 'basico' | 'profissional' | 'enterprise'
}

export type Usuario = {
  id: string
  clinica_id: string
  nome: string
  email: string
  cargo: 'admin' | 'dentista' | 'atendente' | 'recepcionista'
  avatar_url?: string
}

export type Contato = {
  id: string
  clinica_id: string
  nome?: string
  telefone: string
  email?: string
  interesse?: string
  origem?: string
  tipo: 'lead' | 'paciente' | 'inativo'
  ultima_interacao?: string
  criado_em: string
  tags?: Tag[]
}

export type Tag = {
  id: string
  nome: string
  cor: string
}

export type Conversa = {
  id: string
  clinica_id: string
  canal_id: string
  contato_id: string
  atribuido_para?: string
  status: 'aberta' | 'em_atendimento' | 'aguardando' | 'resolvida' | 'spam'
  lida: boolean
  ultima_mensagem?: string
  ultima_msg_em?: string
  total_mensagens: number
  criado_em: string
  // Joins
  contato?: Contato
  atribuido_para_usuario?: Usuario
}

export type Mensagem = {
  id: string
  conversa_id: string
  direcao: 'entrada' | 'saida'
  tipo: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'template'
  conteudo?: string
  midia_url?: string
  status_entrega?: 'enviando' | 'enviado' | 'entregue' | 'lido' | 'falhou'
  automatico: boolean
  criado_em: string
  enviado_por?: string
}

export type PipelineColuna = {
  id: string
  clinica_id: string
  nome: string
  cor: string
  ordem: number
  cards?: PipelineCard[]
}

export type PipelineCard = {
  id: string
  clinica_id: string
  coluna_id: string
  contato_id: string
  conversa_id?: string
  titulo?: string
  valor?: number
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente'
  responsavel_id?: string
  prazo?: string
  criado_em: string
  // Joins
  contato?: Contato
}

export type Agendamento = {
  id: string
  clinica_id: string
  contato_id: string
  dentista_id: string
  inicio: string
  fim: string
  status: 'agendado' | 'confirmado' | 'concluido' | 'cancelado' | 'nao_compareceu'
  observacoes?: string
  lembrete_enviado: boolean
  // Joins
  contato?: Contato
  dentista?: Usuario
  procedimento?: { nome: string; cor: string }
}

export type Automacao = {
  id: string
  clinica_id: string
  nome: string
  descricao?: string
  ativa: boolean
  gatilho_tipo: string
  gatilho_config: Record<string, unknown>
  acao_tipo: string
  acao_config: Record<string, unknown>
  delay_minutos: number
  total_execucoes: number
}
