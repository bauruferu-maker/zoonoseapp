'use client'
import { useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useToast } from '../lib/toast-context'

const SUCCESS_MESSAGES: Record<string, string> = {
  visita_registrada:  'Visita registrada com sucesso',
  visita_atualizada:  'Visita atualizada com sucesso',
  usuario_salvo:      'Usuário salvo com sucesso',
  setor_atribuido:    'Setor atribuído com sucesso',
}

const ERROR_MESSAGES: Record<string, string> = {
  campos_obrigatorios: 'Preencha todos os campos obrigatórios',
  falha_ao_salvar:     'Erro ao salvar. Tente novamente.',
  acesso_negado:       'Acesso negado',
}

export default function AutoToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { showToast } = useToast()

  useEffect(() => {
    const sucesso = searchParams.get('sucesso')
    const error = searchParams.get('error')

    if (sucesso && SUCCESS_MESSAGES[sucesso]) {
      showToast(SUCCESS_MESSAGES[sucesso], 'success')
      const params = new URLSearchParams(searchParams.toString())
      params.delete('sucesso')
      const qs = params.size > 0 ? '?' + params.toString() : ''
      router.replace(`${pathname}${qs}`)
    }
    if (error && ERROR_MESSAGES[error]) {
      showToast(ERROR_MESSAGES[error], 'error')
      const params = new URLSearchParams(searchParams.toString())
      params.delete('error')
      const qs = params.size > 0 ? '?' + params.toString() : ''
      router.replace(`${pathname}${qs}`)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
